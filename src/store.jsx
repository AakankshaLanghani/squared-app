import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabase'

const LOCAL_KEY = 'squared_local'
const GROUPS_CACHE_KEY = 'squared_groups_cache'
const AppContext = createContext(null)

function uid(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len)
}

function joinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt data
  }
  return { deviceId: uid(12), user: null, groupIds: [] }
}

function loadGroupsCache() {
  try {
    const raw = localStorage.getItem(GROUPS_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt data
  }
  return {}
}

// Maps a Supabase row (snake_case) to our in-app group shape.
function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    joinCode: row.join_code,
    members: row.members || [],
    expenses: row.expenses || [],
    settlements: row.settlements || [],
  }
}

export function AppProvider({ children }) {
  const [local, setLocal] = useState(loadLocal)
  const [groups, setGroups] = useState(loadGroupsCache) // groupId -> group data

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
  }, [local])

  // Mirror groups to localStorage so data survives refresh even when
  // Supabase isn't configured (or briefly offline).
  useEffect(() => {
    localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(groups))
  }, [groups])

  // Fetch + subscribe to every group this device belongs to.
  useEffect(() => {
    if (!supabaseReady) return

    let cancelled = false
    local.groupIds.forEach(async (id) => {
      const { data } = await supabase.from('groups').select('*').eq('id', id).single()
      if (data && !cancelled) {
        setGroups((g) => ({ ...g, [id]: fromRow(data) }))
      }
    })

    const channels = local.groupIds.map((id) =>
      supabase
        .channel(`group-${id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${id}` },
          (payload) => {
            setGroups((g) => ({ ...g, [id]: fromRow(payload.new) }))
          }
        )
        .subscribe()
    )

    return () => {
      cancelled = true
      channels.forEach((c) => supabase.removeChannel(c))
    }
  }, [local.groupIds])

  const setUser = (user) => setLocal((l) => ({ ...l, user }))

  const addGroupId = (id) =>
    setLocal((l) =>
      l.groupIds.includes(id) ? l : { ...l, groupIds: [...l.groupIds, id] }
    )

  const createGroup = async (name, memberNames) => {
    const id = uid(10)
    const meId = local.deviceId
    const members = [
      { id: meId, name: local.user?.name || 'You', claimedBy: meId },
      ...memberNames
        .filter((n) => n.trim())
        .map((n) => ({ id: uid(), name: n.trim(), claimedBy: null })),
    ]
    const group = {
      id,
      name,
      createdAt: Date.now(),
      joinCode: joinCode(),
      members,
      expenses: [],
      settlements: [],
    }
    if (supabaseReady) {
      await supabase.from('groups').insert({
        id,
        name,
        created_at: group.createdAt,
        join_code: group.joinCode,
        members,
        expenses: [],
        settlements: [],
      })
    }
    setGroups((g) => ({ ...g, [id]: group }))
    addGroupId(id)
    return id
  }

  const addExpense = async (groupId, expense) => {
    const entry = { id: uid(), date: Date.now(), ...expense }
    const nextExpenses = [...(groups[groupId]?.expenses || []), entry]
    setGroups((g) => ({
      ...g,
      [groupId]: { ...g[groupId], expenses: nextExpenses },
    }))
    if (supabaseReady) {
      await supabase.from('groups').update({ expenses: nextExpenses }).eq('id', groupId)
    }
  }

  const updateExpense = async (groupId, expenseId, updates) => {
    const nextExpenses = (groups[groupId]?.expenses || []).map((e) =>
      e.id === expenseId ? { ...e, ...updates } : e
    )
    setGroups((g) => ({
      ...g,
      [groupId]: { ...g[groupId], expenses: nextExpenses },
    }))
    if (supabaseReady) {
      await supabase.from('groups').update({ expenses: nextExpenses }).eq('id', groupId)
    }
  }

  const deleteExpense = async (groupId, expenseId) => {
    const nextExpenses = (groups[groupId]?.expenses || []).filter((e) => e.id !== expenseId)
    setGroups((g) => ({
      ...g,
      [groupId]: { ...g[groupId], expenses: nextExpenses },
    }))
    if (supabaseReady) {
      await supabase.from('groups').update({ expenses: nextExpenses }).eq('id', groupId)
    }
  }

  const addSettlement = async (groupId, from, to, amount) => {
    const entry = { id: uid(), date: Date.now(), from, to, amount }
    const nextSettlements = [...(groups[groupId]?.settlements || []), entry]
    setGroups((g) => ({
      ...g,
      [groupId]: { ...g[groupId], settlements: nextSettlements },
    }))
    if (supabaseReady) {
      await supabase.from('groups').update({ settlements: nextSettlements }).eq('id', groupId)
    }
  }

  // Join an existing group by its share code. If a matching unclaimed member
  // name isn't picked, joiner is added as a brand-new member.
  const joinGroupByCode = async (code) => {
    if (!supabaseReady) throw new Error('Joining requires the app to be online.')
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('join_code', code.toUpperCase())
      .single()
    if (error || !data) return null
    const group = fromRow(data)
    setGroups((g) => ({ ...g, [group.id]: group }))
    addGroupId(group.id)
    return group
  }

  const claimMember = async (groupId, memberId) => {
    const group = groups[groupId]
    if (!group) return
    const members = group.members.map((m) =>
      m.id === memberId ? { ...m, claimedBy: local.deviceId } : m
    )
    setGroups((g) => ({ ...g, [groupId]: { ...g[groupId], members } }))
    if (supabaseReady) {
      await supabase.from('groups').update({ members }).eq('id', groupId)
    }
  }

  const addSelfAsNewMember = async (groupId) => {
    const group = groups[groupId]
    if (!group) return
    const me = { id: local.deviceId, name: local.user?.name || 'You', claimedBy: local.deviceId }
    const members = [...group.members, me]
    setGroups((g) => ({ ...g, [groupId]: { ...g[groupId], members } }))
    if (supabaseReady) {
      await supabase.from('groups').update({ members }).eq('id', groupId)
    }
  }

  const getGroup = (groupId) => groups[groupId]

  const myMemberId = (group) => {
    if (!group) return null
    const mine = group.members.find((m) => m.claimedBy === local.deviceId)
    return mine ? mine.id : null
  }

  return (
    <AppContext.Provider
      value={{
        user: local.user,
        deviceId: local.deviceId,
        groups: local.groupIds.map((id) => groups[id]).filter(Boolean),
        setUser,
        createGroup,
        addExpense,
        updateExpense,
        deleteExpense,
        addSettlement,
        joinGroupByCode,
        claimMember,
        addSelfAsNewMember,
        getGroup,
        myMemberId,
        supabaseReady,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// balances[memberId] = net amount: positive = owed to them, negative = they owe
export function computeBalances(group) {
  const balances = {}
  group.members.forEach((m) => (balances[m.id] = 0))

  group.expenses.forEach((e) => {
    balances[e.paidBy] = (balances[e.paidBy] || 0) + e.amount
    if (e.shares) {
      Object.entries(e.shares).forEach(([id, share]) => {
        balances[id] = (balances[id] || 0) - share
      })
    } else {
      const share = e.amount / e.splitAmong.length
      e.splitAmong.forEach((id) => {
        balances[id] = (balances[id] || 0) - share
      })
    }
  })

  group.settlements.forEach((s) => {
    balances[s.from] = (balances[s.from] || 0) + s.amount
    balances[s.to] = (balances[s.to] || 0) - s.amount
  })

  return balances
}

// Simplify balances into a minimal list of who-owes-whom
export function simplifyDebts(balances) {
  const creditors = []
  const debtors = []
  Object.entries(balances).forEach(([id, amt]) => {
    const rounded = Math.round(amt * 100) / 100
    if (rounded > 0.5) creditors.push({ id, amt: rounded })
    else if (rounded < -0.5) debtors.push({ id, amt: -rounded })
  })

  creditors.sort((a, b) => b.amt - a.amt)
  debtors.sort((a, b) => b.amt - a.amt)

  const txns = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt)
    txns.push({ from: debtors[i].id, to: creditors[j].id, amount: pay })
    debtors[i].amt -= pay
    creditors[j].amt -= pay
    if (debtors[i].amt < 0.5) i++
    if (creditors[j].amt < 0.5) j++
  }
  return txns
}

export function formatPKR(amount) {
  const n = Math.round(amount)
  return 'Rs. ' + n.toLocaleString('en-PK')
}
