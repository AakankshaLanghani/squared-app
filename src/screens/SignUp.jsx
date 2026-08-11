import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store'

export default function SignUp() {
  const { setUser } = useApp()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const canSubmit = name.trim().length > 0

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-10">
      <img src="/logo.png" alt="Squared" className="w-16 h-16 rounded-2xl mb-6 object-cover" />
      <h1 className="text-3xl font-bold mb-2">Split with friends,<br />without the hassle</h1>
      <p className="text-sm text-black/50 mb-8">
        Track shared expenses in PKR and settle up — no back and forth.
      </p>

      <label className="text-xs font-medium text-black/50 mb-1">Your name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Ayesha Khan"
        className="bg-white rounded-2xl px-4 py-3.5 mb-4 outline-none text-base"
      />

      <label className="text-xs font-medium text-black/50 mb-1">Phone number (optional)</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="03xx xxxxxxx"
        className="bg-white rounded-2xl px-4 py-3.5 mb-8 outline-none text-base"
      />

      <motion.button
        whileTap={canSubmit ? { scale: 0.97 } : {}}
        disabled={!canSubmit}
        onClick={() => setUser({ name: name.trim(), phone: phone.trim() })}
        className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-40"
        style={{ background: 'var(--ink)', color: 'var(--accent)' }}
      >
        Get started
      </motion.button>
    </div>
  )
}
