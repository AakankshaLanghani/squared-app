import { motion } from 'framer-motion'
import { useApp, computeBalances, formatPKR } from '../store'
import { GroupsIcon, PlusIcon } from '../components/icons'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Groups({ onOpenGroup, onCreateGroup, onJoinGroup }) {
  const { groups, myMemberId } = useApp()

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-lg font-semibold">Your groups</h1>
      </div>

      <div className="flex gap-2 px-5 mt-2 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCreateGroup}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          <PlusIcon /> New group
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onJoinGroup}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-white"
        >
          Join group
        </motion.button>
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
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="px-5 flex flex-col gap-2.5 pb-6"
        >
          {groups.map((g) => {
            const balances = computeBalances(g)
            const mine = balances[myMemberId(g)] || 0
            return (
              <motion.button
                key={g.id}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenGroup(g.id)}
                className="bg-white rounded-2xl p-4 flex items-center justify-between text-left"
              >
                <div>
                  <p className="font-semibold text-sm">{g.name}</p>
                  <p className="text-xs text-black/40 mt-0.5">
                    {g.members.length} people · {g.expenses.length} expenses
                  </p>
                </div>
                <div className="text-right">
                  {Math.abs(mine) < 1 ? (
                    <p className="text-xs text-black/40">settled</p>
                  ) : mine > 0 ? (
                    <>
                      <p className="text-[10px] text-black/40">owed to you</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatPKR(mine)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-black/40">you owe</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                        {formatPKR(-mine)}
                      </p>
                    </>
                  )}
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
