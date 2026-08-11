import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store'
import TopBar from '../components/TopBar'

export default function CreateGroup({ onBack, onCreated }) {
  const { createGroup } = useApp()
  const [name, setName] = useState('')
  const [members, setMembers] = useState([''])

  const updateMember = (i, value) => {
    setMembers((m) => m.map((v, idx) => (idx === i ? value : v)))
  }
  const addMemberField = () => setMembers((m) => [...m, ''])
  const removeMemberField = (i) =>
    setMembers((m) => m.filter((_, idx) => idx !== i))

  const [creating, setCreating] = useState(false)

  const canSubmit = name.trim().length > 0 && !creating

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    const id = await createGroup(name.trim(), members)
    onCreated(id)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="New group" onBack={onBack} />

      <div className="px-5 mt-2 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-black/50 mb-1 block">
            Group name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flatmates, Hunza Trip"
            className="w-full bg-white rounded-2xl px-4 py-3.5 outline-none text-base"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black/50 mb-1 block">
            Friends in this group
          </label>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {members.map((m, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2"
                >
                  <input
                    value={m}
                    onChange={(e) => updateMember(i, e.target.value)}
                    placeholder={`Friend ${i + 1} name`}
                    className="flex-1 bg-white rounded-2xl px-4 py-3 outline-none text-base"
                  />
                  {members.length > 1 && (
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeMemberField(i)}
                      className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-black/40"
                    >
                      ✕
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addMemberField}
            className="mt-2 text-xs font-semibold px-3 py-2 rounded-full self-start"
            style={{ background: 'white' }}
          >
            + Add another friend
          </motion.button>
        </div>
      </div>

      <div className="mt-auto px-5 py-6">
        <motion.button
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          disabled={!canSubmit}
          onClick={handleCreate}
          className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-40"
          style={{ background: 'var(--ink)', color: 'var(--accent)' }}
        >
          {creating ? 'Creating...' : 'Create group'}
        </motion.button>
      </div>
    </div>
  )
}
