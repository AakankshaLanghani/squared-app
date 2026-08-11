import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, computeBalances, formatPKR } from '../store'
import { BellIcon, EyeIcon, PlusIcon, ReceiptIcon, ClockIcon, GroupsIcon } from '../components/icons'
import AnimatedNumber from '../components/AnimatedNumber'

const CARD_STYLES = [
  { bg: 'var(--accent)', fg: 'var(--ink)', pattern: true },
  { bg: 'var(--ink)', fg: '#fff', pattern: false },
  { bg: '#e9e6ff', fg: 'var(--ink)', pattern: false },
]

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Home({ onOpenGroup, onCreateGroup, onJoinGroup }) {
  const { user, groups, myMemberId } = useApp()
  const [hidden, setHidden] = useState(false)

  let totalOwedToMe = 0
  let totalIOwe = 0
  const activity = []

  groups.forEach((g) => {
    const balances = computeBalances(g)
    const mine = balances[myMemberId(g)] || 0
    if (mine > 0) totalOwedToMe += mine
    else totalIOwe += -mine
    g.expenses.forEach((e) =>
      activity.push({ ...e, groupName: g.name, groupId: g.id })
    )
  })
  const net = totalOwedToMe - totalIOwe
  activity.sort((a, b) => b.date - a.date)

  const pendingGroups = groups.filter((g) => g.members.some((m) => !m.claimedBy))

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <p className="text-xs text-black/40">Good to see you</p>
          <h1 className="text-lg font-semibold">{user.name.split(' ')[0]}</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
        >
          <BellIcon className="text-black/60" />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 mt-2"
      >
        <div className="rounded-3xl p-6 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-black/40">Your net balance</p>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setHidden((h) => !h)}
              className="text-black/40"
            >
              <EyeIcon off={hidden} />
            </motion.button>
          </div>
          <p className="text-3xl font-bold mt-1 tabular-nums">
            {hidden ? (
              '••••••'
            ) : (
              <AnimatedNumber
                value={net}
                format={(v) => (v >= 0 ? formatPKR(v) : `-${formatPKR(Math.abs(v))}`)}
              />
            )}
          </p>
          <div className="flex gap-2 mt-5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCreateGroup}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5"
              style={{ background: 'var(--ink)', color: 'var(--accent)' }}
            >
              <PlusIcon /> New group
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onJoinGroup}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            >
              Join group
            </motion.button>
          </div>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-[11px] text-black/40">You're owed</p>
              <p className="text-sm font-semibold text-green-600 tabular-nums">
                <AnimatedNumber value={totalOwedToMe} format={formatPKR} />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-black/40">You owe</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--danger)' }}>
                <AnimatedNumber value={totalIOwe} format={formatPKR} />
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {pendingGroups.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpenGroup(pendingGroups[0].id)}
          className="mx-5 mt-5 rounded-2xl px-4 py-3 flex items-center gap-3 text-left"
          style={{ background: '#fff3cd' }}
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <ClockIcon className="text-black/60" />
          </span>
          <p className="text-xs font-medium flex-1">
            {pendingGroups.length === 1
              ? `Some friends in "${pendingGroups[0].name}" haven't joined yet — share the code`
              : `${pendingGroups.length} groups are waiting on friends to join — share your codes`}
          </p>
        </motion.button>
      )}

      <div className="flex items-center justify-between px-5 mt-7 mb-2">
        <h2 className="text-base font-semibold">Your groups</h2>
        <button onClick={onCreateGroup} className="text-xs font-semibold text-black/40">
          + New
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="mx-5 bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-3">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface)' }}
          >
            <GroupsIcon className="text-black/40" />
          </span>
          <div>
            <p className="text-sm font-semibold">No groups yet</p>
            <p className="text-xs text-black/40 mt-1">
              Start one with your flatmates, trip squad, or dinner crew
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCreateGroup}
            className="text-xs font-semibold px-4 py-2.5 rounded-full mt-1"
            style={{ background: 'var(--ink)', color: 'var(--accent)' }}
          >
            + Create your first group
          </motion.button>
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="flex gap-3 overflow-x-auto px-5 pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {groups.map((g, i) => {
            const balances = computeBalances(g)
            const mine = balances[myMemberId(g)] || 0
            const style = CARD_STYLES[i % CARD_STYLES.length]
            return (
              <motion.button
                key={g.id}
                variants={itemVariants}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenGroup(g.id)}
                className="shrink-0 w-[190px] h-[120px] rounded-3xl p-4 flex flex-col justify-between text-left relative overflow-hidden"
                style={{ background: style.bg, color: style.fg }}
              >
                {style.pattern && (
                  <span
                    className="absolute -right-6 -top-6 w-24 h-24 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.06)' }}
                  />
                )}
                <p className="font-semibold text-sm relative">{g.name}</p>
                <div className="relative">
                  <p className="text-[10px] opacity-60">
                    {Math.abs(mine) < 1 ? 'settled up' : mine > 0 ? 'owed to you' : 'you owe'}
                  </p>
                  <p className="text-lg font-bold">
                    {Math.abs(mine) < 1 ? '—' : formatPKR(Math.abs(mine))}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      )}

      <div className="flex items-center justify-between px-5 mt-7 mb-2">
        <h2 className="text-base font-semibold">Recent activity</h2>
      </div>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="px-5 flex flex-col gap-2 pb-6"
      >
        {activity.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-sm text-black/40">
            No expenses yet.
          </div>
        )}
        {activity.slice(0, 8).map((e) => (
          <motion.button
            key={e.id}
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenGroup(e.groupId)}
            className="bg-white rounded-2xl p-3.5 flex items-center gap-3 text-left"
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--surface)' }}
            >
              <ReceiptIcon className="text-black/50" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{e.description}</p>
              <p className="text-xs text-black/40 truncate">
                {e.groupName} ·{' '}
                {new Date(e.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <p className="text-sm font-bold shrink-0">{formatPKR(e.amount)}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
