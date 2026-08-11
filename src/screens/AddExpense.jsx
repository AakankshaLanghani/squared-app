import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp, formatPKR } from '../store'
import TopBar from '../components/TopBar'
import LoadingScreen from '../components/LoadingScreen'

function uid() {
  return Math.random().toString(36).slice(2, 8)
}

function computeItemsResult(items, taxNum) {
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  )
  const perPerson = {}
  items.forEach((it) => {
    const lineTotal = (Number(it.price) || 0) * (Number(it.qty) || 1)
    const n = it.assignedTo.length
    if (n === 0) return
    const share = lineTotal / n
    it.assignedTo.forEach((id) => {
      perPerson[id] = (perPerson[id] || 0) + share
    })
  })
  const shares = {}
  Object.entries(perPerson).forEach(([id, itemTotal]) => {
    const taxShare = subtotal > 0 ? taxNum * (itemTotal / subtotal) : 0
    shares[id] = itemTotal + taxShare
  })
  return { subtotal, total: subtotal + taxNum, shares }
}

export default function AddExpense({ groupId, expense, onBack, onDone }) {
  const { getGroup, addExpense, updateExpense, deleteExpense, myMemberId } = useApp()
  const group = getGroup(groupId)
  const myId = myMemberId(group)
  const isEditing = Boolean(expense)
  const members = group?.members || []

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [description, setDescription] = useState(expense?.description || '')
  const [paidBy, setPaidBy] = useState(expense?.paidBy || myId || members[0]?.id)
  const [splitAmong, setSplitAmong] = useState(
    expense?.splitAmong || members.map((m) => m.id)
  )
  const [splitMode, setSplitMode] = useState(() => {
    if (expense?.items) return 'items'
    if (expense?.shares) return 'custom'
    return 'equal'
  })
  const [customShares, setCustomShares] = useState(() => {
    const init = {}
    if (expense?.shares && !expense?.items) {
      Object.entries(expense.shares).forEach(([id, v]) => (init[id] = String(v)))
    }
    return init
  })
  const [items, setItems] = useState(
    () =>
      expense?.items?.map((it) => ({
        id: it.id || uid(),
        name: it.name,
        price: String(it.price),
        qty: String(it.qty || 1),
        assignedTo: it.assignedTo,
      })) || [{ id: uid(), name: '', price: '', qty: '1', assignedTo: [] }]
  )
  const [tax, setTax] = useState(expense?.tax ? String(expense.tax) : '')

  if (!group) return <LoadingScreen />

  const toggleMember = (id) => {
    setSplitAmong((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    )
  }

  const updateItem = (id, patch) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const toggleItemAssignee = (itemId, memberId) =>
    setItems((its) =>
      its.map((it) =>
        it.id === itemId
          ? {
              ...it,
              assignedTo: it.assignedTo.includes(memberId)
                ? it.assignedTo.filter((x) => x !== memberId)
                : [...it.assignedTo, memberId],
            }
          : it
      )
    )
  const addItem = () =>
    setItems((its) => [...its, { id: uid(), name: '', price: '', qty: '1', assignedTo: [] }])
  const removeItem = (id) => setItems((its) => its.filter((it) => it.id !== id))

  const taxNum = Number(tax) || 0
  const itemsResult = computeItemsResult(items, taxNum)

  const numericAmount = splitMode === 'items' ? itemsResult.total : Number(amount)
  const customTotal = splitAmong.reduce(
    (sum, id) => sum + (Number(customShares[id]) || 0),
    0
  )
  const customMatches = Math.abs(customTotal - Number(amount)) < 0.5

  const itemsValid =
    items.length > 0 &&
    items.every(
      (it) => it.name.trim() && Number(it.price) > 0 && it.assignedTo.length > 0
    )

  const canSubmit =
    description.trim().length > 0 &&
    paidBy &&
    (splitMode === 'items'
      ? itemsValid && itemsResult.total > 0
      : numericAmount > 0 &&
        splitAmong.length > 0 &&
        (splitMode === 'equal' || customMatches))

  const handleSave = () => {
    let payload

    if (splitMode === 'items') {
      const cleanItems = items.map((it) => ({
        id: it.id,
        name: it.name.trim(),
        price: Number(it.price) || 0,
        qty: Number(it.qty) || 1,
        assignedTo: it.assignedTo,
      }))
      const allAssigned = [...new Set(cleanItems.flatMap((it) => it.assignedTo))]
      payload = {
        amount: itemsResult.total,
        description: description.trim(),
        paidBy,
        splitAmong: allAssigned,
        shares: itemsResult.shares,
        items: cleanItems,
        tax: taxNum,
      }
    } else {
      payload = {
        amount: numericAmount,
        description: description.trim(),
        paidBy,
        splitAmong,
        items: null,
        tax: null,
      }
      if (splitMode === 'custom') {
        payload.shares = Object.fromEntries(
          splitAmong.map((id) => [id, Number(customShares[id]) || 0])
        )
      } else {
        payload.shares = null
      }
    }

    if (isEditing) {
      updateExpense(groupId, expense.id, payload)
    } else {
      addExpense(groupId, payload)
    }
    onDone()
  }

  const handleDelete = () => {
    if (confirm('Delete this expense? This cannot be undone.')) {
      deleteExpense(groupId, expense.id)
      onDone()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={isEditing ? 'Edit expense' : 'Add expense'} onBack={onBack} />

      <div className="px-5 mt-2 flex flex-col gap-4 pb-4">
        {splitMode !== 'items' && (
          <div>
            <label className="text-xs font-medium text-black/50 mb-1 block">
              Amount (PKR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-white rounded-2xl px-4 py-3.5 outline-none text-2xl font-bold"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-black/50 mb-1 block">
            What was it for?
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner, Cab, Groceries"
            className="w-full bg-white rounded-2xl px-4 py-3.5 outline-none text-base"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black/50 mb-1 block">
            Paid by
          </label>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setPaidBy(m.id)}
                className="px-3.5 py-2 rounded-full text-sm font-medium"
                animate={{
                  backgroundColor: paidBy === m.id ? '#202020' : '#ffffff',
                  color: paidBy === m.id ? '#c9f158' : '#202020',
                }}
                transition={{ duration: 0.15 }}
              >
                {m.id === myId ? 'You' : m.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-black/50 block">Split</label>
            <div className="flex bg-white rounded-full p-0.5">
              {['equal', 'custom', 'items'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{
                    background: splitMode === mode ? 'var(--ink)' : 'transparent',
                    color: splitMode === mode ? 'var(--accent)' : 'var(--ink)',
                  }}
                >
                  {mode === 'items' ? 'By item' : mode}
                </button>
              ))}
            </div>
          </div>

          {splitMode !== 'items' && (
            <div className="flex flex-wrap gap-2 mb-2">
              {group.members.map((m) => (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleMember(m.id)}
                  className="px-3.5 py-2 rounded-full text-sm font-medium border"
                  animate={{
                    backgroundColor: splitAmong.includes(m.id) ? '#c9f158' : '#ffffff',
                    borderColor: splitAmong.includes(m.id) ? '#c9f158' : 'rgba(0,0,0,0.08)',
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {m.id === myId ? 'You' : m.name}
                </motion.button>
              ))}
            </div>
          )}

          {splitMode === 'custom' && (
            <div className="flex flex-col gap-2 mt-2">
              {splitAmong.map((id) => {
                const m = group.members.find((mm) => mm.id === id)
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-20 shrink-0 truncate">
                      {id === myId ? 'You' : m?.name}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={customShares[id] || ''}
                      onChange={(e) =>
                        setCustomShares((s) => ({ ...s, [id]: e.target.value }))
                      }
                      placeholder="0"
                      className="flex-1 bg-white rounded-xl px-3 py-2 outline-none text-sm"
                    />
                  </div>
                )
              })}
              <p
                className="text-xs mt-1"
                style={{ color: customMatches ? '#16a34a' : 'var(--danger)' }}
              >
                {formatPKR(customTotal)} of {formatPKR(Number(amount) || 0)} assigned
                {!customMatches && ' — must add up to the total'}
              </p>
            </div>
          )}

          {splitMode === 'items' && (
            <div className="flex flex-col gap-3 mt-2">
              <AnimatePresence initial={false}>
                {items.map((it, idx) => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-2xl p-3.5"
                  >
                    <div className="flex gap-2 mb-2">
                      <input
                        value={it.name}
                        onChange={(e) => updateItem(it.id, { name: e.target.value })}
                        placeholder={`Item ${idx + 1} name`}
                        className="flex-1 bg-[var(--surface)] rounded-xl px-3 py-2 outline-none text-sm min-w-0"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={it.price}
                        onChange={(e) => updateItem(it.id, { price: e.target.value })}
                        placeholder="Price"
                        className="w-20 bg-[var(--surface)] rounded-xl px-2 py-2 outline-none text-sm"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={it.qty}
                        onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                        placeholder="Qty"
                        className="w-12 bg-[var(--surface)] rounded-xl px-2 py-2 outline-none text-sm"
                      />
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(it.id)}
                          className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-black/40"
                          style={{ background: 'var(--surface)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.members.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => toggleItemAssignee(it.id, m.id)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                          style={{
                            background: it.assignedTo.includes(m.id)
                              ? '#c9f158'
                              : 'var(--surface)',
                            borderColor: it.assignedTo.includes(m.id)
                              ? '#c9f158'
                              : 'transparent',
                          }}
                        >
                          {m.id === myId ? 'You' : m.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addItem}
                className="text-xs font-semibold px-3 py-2 rounded-full self-start bg-white"
              >
                + Add item
              </motion.button>

              <div className="bg-white rounded-2xl p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/40">Subtotal</span>
                  <span className="text-sm font-semibold">
                    {formatPKR(itemsResult.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/40">Tax / service (PKR)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0"
                    className="w-24 bg-[var(--surface)] rounded-lg px-2 py-1 outline-none text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-1">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="text-base font-bold">{formatPKR(itemsResult.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto px-5 py-6 flex flex-col gap-2">
        <motion.button
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          disabled={!canSubmit}
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-40"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          {isEditing ? 'Save changes' : 'Save expense'}
        </motion.button>
        {isEditing && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDelete}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-red-500 bg-white"
          >
            Delete expense
          </motion.button>
        )}
      </div>
    </div>
  )
}
