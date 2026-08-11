import { motion } from 'framer-motion'
import { GroupsIcon, ReceiptIcon } from '../components/icons'

const SplitIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FEATURES = [
  { Icon: SplitIcon, text: 'Split any bill equally in seconds' },
  { Icon: GroupsIcon, text: 'Keep a running tab with each friend group' },
  { Icon: ReceiptIcon, text: 'Share receipts instantly' },
]

export default function Landing({ onGetStarted }) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center">
        <motion.img
          src="/logo.png"
          alt="Squared"
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 rounded-2xl mb-6 object-cover"
        />
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl font-bold leading-tight mb-3"
        >
          All settled.
          <br />
          All squared.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="text-sm text-black/50 mb-8 max-w-[300px]"
        >
          Friends, trips, flatmates — track every shared rupee and settle up without the awkward math
        </motion.p>

        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.24 } } }}
        >
          {FEATURES.map(({ Icon, text }) => (
            <motion.div
              key={text}
              variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
              className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface)' }}
              >
                <Icon className="text-black/60" />
              </span>
              <p className="text-sm font-medium">{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        onClick={onGetStarted}
        className="w-full py-4 rounded-2xl font-semibold text-base mt-8"
        style={{ background: 'var(--ink)', color: 'var(--accent)' }}
      >
        Get started
      </motion.button>
    </div>
  )
}
