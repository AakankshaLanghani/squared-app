import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InfoIcon, GroupsIcon, ReceiptIcon, ShareIcon } from './icons'

const SplitIcon = (p) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CheckIcon = (p) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const STEPS = [
  {
    Icon: GroupsIcon,
    title: 'Create a group',
    text: 'Start a group for your flatmates, a trip, or a friend circle, and add the people in it.',
  },
  {
    Icon: SplitIcon,
    title: 'Add an expense',
    text: 'Log what was paid and who paid it. Split it equally, or set a custom amount for each person.',
  },
  {
    Icon: CheckIcon,
    title: 'See who owes whom',
    text: 'Squared works out the simplest way to settle up, and you can mark a debt as paid in one tap.',
  },
  {
    Icon: ShareIcon,
    title: 'Invite friends & share receipts',
    text: 'Share your group’s join code so friends see the same balances, or share a receipt straight to WhatsApp.',
  },
]

export function HelpButton({ onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-5 w-11 h-11 rounded-full flex items-center justify-center z-40 shadow-lg"
      style={{
        background: 'var(--ink)',
        color: 'var(--accent)',
        maxWidth: 430,
        marginLeft: 'max(0px, calc((100vw - 430px) / 2))',
      }}
    >
      <InfoIcon />
    </motion.button>
  )
}

export default function Tour({ open, onClose }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  const handleClose = () => {
    setStep(0)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl p-6 pb-8"
            style={{ maxWidth: 430, background: 'var(--white)' }}
          >
            <div className="flex justify-center gap-1.5 mb-5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 20 : 6,
                    background: i === step ? 'var(--ink)' : 'rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--accent)', color: 'var(--ink)' }}
            >
              <s.Icon />
            </div>

            <h2 className="text-lg font-bold mb-1.5">{s.title}</h2>
            <p className="text-sm text-black/50 mb-6">{s.text}</p>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((n) => n - 1)}
                  className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-white"
                  style={{ background: 'var(--surface)' }}
                >
                  Back
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => (isLast ? handleClose() : setStep((n) => n + 1))}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                style={{ background: 'var(--ink)', color: 'var(--accent)' }}
              >
                {isLast ? 'Got it' : 'Next'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
