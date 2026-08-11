import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp, computeBalances, simplifyDebts, formatPKR } from '../store'
import TopBar from '../components/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import { ShareIcon, LinkIcon } from '../components/icons'
import {
  drawExpenseReceipt,
  summaryText,
  shareBlob,
  shareText,
  shareLink,
  expenseShareUrl,
  groupShareUrl,
} from '../utils/receipt'

function nameFor(group, id, myId) {
  if (id === myId) return 'You'
  return group.members.find((m) => m.id === id)?.name || 'Unknown'
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function GroupDetail({ groupId, onBack, onAddExpense, onEditExpense }) {
  const { getGroup, addSettlement, myMemberId } = useApp()
  const group = getGroup(groupId)
  const [sharingId, setSharingId] = useState(null)
  const [settlingKey, setSettlingKey] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopiedId, setLinkCopiedId] = useState(null)
  const [groupLinkCopied, setGroupLinkCopied] = useState(false)

  if (!group) return <LoadingScreen />

  const myId = myMemberId(group)
  const balances = computeBalances(group)
  const debts = simplifyDebts(balances)

  const sortedExpenses = [...group.expenses].sort((a, b) => b.date - a.date)

  const handleShareSummary = async () => {
    const result = await shareText(summaryText(group, debts, myId))
    if (result === 'copied') alert('Balances copied — paste them in your chat.')
  }

  const handleShareInvite = async () => {
    const result = await shareText(
      `Join "${group.name}" on Squared to track shared expenses. Use code: ${group.joinCode}`
    )
    if (result === 'copied') {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1500)
    }
  }

  const handleCopyGroupLink = async () => {
    const result = await shareLink(groupShareUrl(groupId), `${group.name} — Squared`)
    if (result === 'copied') {
      setGroupLinkCopied(true)
      setTimeout(() => setGroupLinkCopied(false), 1500)
    }
  }

  const handleCopyExpenseLink = async (expense) => {
    const result = await shareLink(
      expenseShareUrl(groupId, expense.id),
      `${expense.description} — Squared`
    )
    if (result === 'copied') {
      setLinkCopiedId(expense.id)
      setTimeout(() => setLinkCopiedId(null), 1500)
    }
  }

  const handleShareExpense = async (expense) => {
    setSharingId(expense.id)
    try {
      const blob = await drawExpenseReceipt(group, expense, myId)
      await shareBlob(
        blob,
        `${expense.description.replace(/\s+/g, '-')}-receipt.png`,
        `${expense.description} — ${formatPKR(expense.amount)} via Squared`
      )
    } finally {
      setSharingId(null)
    }
  }

  const handleSettle = (d) => {
    const key = d.from + d.to
    if (settlingKey) return
    setSettlingKey(key)
    setTimeout(() => {
      addSettlement(groupId, d.from, d.to, d.amount)
      setSettlingKey(null)
    }, 260)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pr-5">
        <TopBar title={group.name} onBack={onBack} />
        <div className="flex gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopyGroupLink}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
          >
            <LinkIcon style={{ color: groupLinkCopied ? '#16a34a' : undefined }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShareSummary}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
          >
            <ShareIcon />
          </motion.button>
        </div>
      </div>

      <div className="px-5 mt-1 mb-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleShareInvite}
          className="w-full bg-white rounded-2xl px-4 py-2.5 flex items-center justify-between"
        >
          <span className="text-xs text-black/40">
            Invite friends with code <span className="font-semibold text-black">{group.joinCode}</span>
          </span>
          <span className="text-[11px] font-semibold" style={{ color: codeCopied ? '#16a34a' : 'var(--ink)' }}>
            {codeCopied ? 'Copied' : 'Share'}
          </span>
        </motion.button>
      </div>

      <div className="px-5 mt-2">
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {group.members.map((m) => {
            const bal = balances[m.id] || 0
            return (
              <motion.div
                key={m.id}
                variants={itemVariants}
                className="bg-white rounded-2xl px-4 py-3 shrink-0 min-w-[110px]"
              >
                <p className="text-xs font-medium truncate">
                  {m.id === myId ? 'You' : m.name}
                  {!m.claimedBy && (
                    <span className="ml-1 text-[9px] text-black/30">(pending)</span>
                  )}
                </p>
                <p
                  className="text-sm font-bold mt-0.5 tabular-nums"
                  style={{
                    color:
                      Math.abs(bal) < 1
                        ? '#9a9a9a'
                        : bal > 0
                        ? '#16a34a'
                        : 'var(--danger)',
                  }}
                >
                  {Math.abs(bal) < 1
                    ? 'settled'
                    : (bal > 0 ? '+' : '-') + formatPKR(Math.abs(bal))}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {debts.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Who owes whom</h2>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {debts.map((d, i) => {
                const key = d.from + d.to
                const settling = settlingKey === key
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={
                      settling
                        ? { opacity: 0, scale: 0.9, x: 40 }
                        : { opacity: 1, y: 0, scale: 1, x: 0 }
                    }
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, delay: settling ? 0 : i * 0.04 }}
                    className="bg-white rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <p className="text-sm">
                      <span className="font-semibold">{nameFor(group, d.from, myId)}</span>
                      <span className="text-black/40"> owes </span>
                      <span className="font-semibold">{nameFor(group, d.to, myId)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{formatPKR(d.amount)}</p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSettle(d)}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      >
                        Settle
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 mt-6 mb-2">
        <h2 className="text-sm font-semibold">Expenses</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAddExpense}
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          + Add expense
        </motion.button>
      </div>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="px-5 flex flex-col gap-2 pb-8"
      >
        {sortedExpenses.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-sm text-black/40">
            No expenses yet. Add the first one.
          </div>
        )}
        {sortedExpenses.map((e) => (
          <motion.div
            key={e.id}
            variants={itemVariants}
            onClick={() => onEditExpense(e)}
            className="bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-semibold text-sm">{e.description}</p>
              <p className="text-xs text-black/40 mt-0.5">
                {nameFor(group, e.paidBy, myId)} paid
                {e.items ? ' · by item' : e.shares ? ' · custom split' : ''} ·{' '}
                {new Date(e.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold">{formatPKR(e.amount)}</p>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(evt) => {
                  evt.stopPropagation()
                  handleCopyExpenseLink(e)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface)' }}
              >
                <LinkIcon
                  className={linkCopiedId === e.id ? '' : 'text-black/50'}
                  style={{ color: linkCopiedId === e.id ? '#16a34a' : undefined }}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(evt) => {
                  evt.stopPropagation()
                  handleShareExpense(e)
                }}
                disabled={sharingId === e.id}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface)' }}
              >
                {sharingId === e.id ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    className="w-3 h-3 rounded-full border-2 border-black/20 border-t-black/60"
                  />
                ) : (
                  <ShareIcon className="text-black/50" />
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
