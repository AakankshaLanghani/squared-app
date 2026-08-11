import { useEffect, useState } from 'react'
import { computeBalances, simplifyDebts, formatPKR } from '../store'
import { supabase, supabaseReady } from '../supabase'

function nameFor(group, id) {
  return group.members.find((m) => m.id === id)?.name || 'Unknown'
}

export default function ShareView({ params }) {
  const [group, setGroup] = useState(null)
  const [status, setStatus] = useState('loading') // loading | notfound | error | ready

  useEffect(() => {
    if (!supabaseReady) {
      setStatus('error')
      return
    }
    supabase
      .from('groups')
      .select('*')
      .eq('id', params.groupId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus('notfound')
          return
        }
        setGroup({
          id: data.id,
          name: data.name,
          joinCode: data.join_code,
          members: data.members || [],
          expenses: data.expenses || [],
          settlements: data.settlements || [],
        })
        setStatus('ready')
      })
  }, [params.groupId])

  if (status === 'loading') {
    return (
      <div className="app-shell items-center justify-center">
        <p className="text-sm text-black/40">Loading...</p>
      </div>
    )
  }

  if (status === 'notfound' || status === 'error') {
    return (
      <div className="app-shell items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold mb-1">Link not found</p>
        <p className="text-xs text-black/40 mb-6">
          This link may be broken or the bill was removed.
        </p>
        <a
          href="/"
          className="text-xs font-semibold px-4 py-2.5 rounded-full"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          Open Squared
        </a>
      </div>
    )
  }

  const expense = params.expenseId
    ? group.expenses.find((e) => e.id === params.expenseId)
    : null

  return (
    <div className="app-shell">
      <div className="flex flex-col items-center px-6 pt-8 pb-4">
        <img src="/logo.png" alt="Squared" className="w-10 h-10 rounded-xl mb-2" />
        <p className="text-xs text-black/40">Shared via Squared</p>
      </div>

      {expense ? (
        <ExpenseShare group={group} expense={expense} />
      ) : (
        <GroupShare group={group} />
      )}

      <div className="px-5 py-6 mt-auto">
        <a
          href="/"
          className="w-full block text-center py-4 rounded-2xl font-semibold text-base"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          Open Squared
        </a>
      </div>
    </div>
  )
}

function ExpenseShare({ group, expense }) {
  if (!expense) {
    return (
      <p className="text-center text-sm text-black/40 px-6">
        This expense was removed from the group.
      </p>
    )
  }

  return (
    <div className="px-5">
      <div className="bg-white rounded-3xl p-6">
        <p className="text-3xl font-bold">{formatPKR(expense.amount)}</p>
        <p className="text-sm text-black/40 mt-1">
          {expense.description} · {group.name}
        </p>
        <p className="text-sm font-semibold mt-4">
          Paid by {nameFor(group, expense.paidBy)}
        </p>

        {expense.items && (
          <div className="mt-4 flex flex-col gap-1.5">
            <p className="text-xs text-black/40 mb-1">Items</p>
            {expense.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <span>
                  {it.qty > 1 ? `${it.qty}x ` : ''}
                  {it.name}
                </span>
                <span className="font-medium">{formatPKR(it.price * it.qty)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-black/5 flex flex-col gap-2">
          <p className="text-xs text-black/40">
            {expense.shares ? 'Split' : 'Split equally'}
          </p>
          {(expense.splitAmong || []).map((id) => {
            const share = expense.shares
              ? expense.shares[id]
              : expense.amount / expense.splitAmong.length
            return (
              <div key={id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{nameFor(group, id)}</span>
                <span className="text-sm font-bold">{formatPKR(share)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GroupShare({ group }) {
  const balances = computeBalances(group)
  const debts = simplifyDebts(balances)

  return (
    <div className="px-5">
      <div className="bg-white rounded-3xl p-6">
        <p className="text-lg font-bold mb-4">{group.name}</p>

        <div className="flex flex-col gap-2 mb-4">
          {group.members.map((m) => {
            const bal = balances[m.id] || 0
            return (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{m.name}</span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      Math.abs(bal) < 1 ? '#9a9a9a' : bal > 0 ? '#16a34a' : 'var(--danger)',
                  }}
                >
                  {Math.abs(bal) < 1
                    ? 'settled'
                    : (bal > 0 ? '+' : '-') + formatPKR(Math.abs(bal))}
                </span>
              </div>
            )
          })}
        </div>

        {debts.length > 0 && (
          <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
            <p className="text-xs text-black/40 mb-1">Who owes whom</p>
            {debts.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {nameFor(group, d.from)} owes {nameFor(group, d.to)}
                </span>
                <span className="font-bold">{formatPKR(d.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
