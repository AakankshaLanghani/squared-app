import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store'
import TopBar from '../components/TopBar'

export default function JoinGroup({ onBack, onJoined }) {
  const { joinGroupByCode, claimMember, addSelfAsNewMember, deviceId } = useApp()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | notfound | found
  const [group, setGroup] = useState(null)

  const handleLookup = async () => {
    if (!code.trim()) return
    setStatus('loading')
    try {
      const g = await joinGroupByCode(code.trim())
      if (!g) {
        setStatus('notfound')
        return
      }
      const alreadyIn = g.members.some((m) => m.claimedBy === deviceId)
      if (alreadyIn) {
        onJoined(g.id)
        return
      }
      setGroup(g)
      setStatus('found')
    } catch {
      setStatus('notfound')
    }
  }

  const handleClaim = async (memberId) => {
    await claimMember(group.id, memberId)
    onJoined(group.id)
  }

  const handleAddSelf = async () => {
    await addSelfAsNewMember(group.id)
    onJoined(group.id)
  }

  const unclaimed = group?.members.filter((m) => !m.claimedBy) || []

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Join a group" onBack={onBack} />

      {status !== 'found' && (
        <div className="px-5 mt-2 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-black/50 mb-1 block">
              Enter the 6-character code your friend shared
            </label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setStatus('idle')
              }}
              placeholder="e.g. AB12CD"
              maxLength={6}
              className="w-full bg-white rounded-2xl px-4 py-3.5 outline-none text-2xl font-bold tracking-widest uppercase"
            />
            {status === 'notfound' && (
              <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
                No group found with that code. Double check with your friend.
              </p>
            )}
          </div>

          <motion.button
            whileTap={code.trim() ? { scale: 0.97 } : {}}
            disabled={!code.trim() || status === 'loading'}
            onClick={handleLookup}
            className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-40"
            style={{ background: 'var(--ink)', color: 'var(--accent)' }}
          >
            {status === 'loading' ? 'Looking up...' : 'Find group'}
          </motion.button>
        </div>
      )}

      {status === 'found' && group && (
        <div className="px-5 mt-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-black/40">You're joining</p>
            <p className="text-lg font-bold">{group.name}</p>
          </div>

          {unclaimed.length > 0 && (
            <div>
              <label className="text-xs font-medium text-black/50 mb-1 block">
                Which one is you?
              </label>
              <div className="flex flex-col gap-2">
                {unclaimed.map((m) => (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClaim(m.id)}
                    className="bg-white rounded-2xl px-4 py-3.5 text-left font-medium text-sm"
                  >
                    {m.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddSelf}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{ background: 'var(--ink)', color: 'var(--accent)' }}
          >
            I'm not listed — add me
          </motion.button>
        </div>
      )}
    </div>
  )
}
