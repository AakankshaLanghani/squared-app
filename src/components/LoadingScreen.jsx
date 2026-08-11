import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-[3px] border-black/10"
        style={{ borderTopColor: 'var(--ink)' }}
      />
      <p className="text-xs text-black/40">Loading...</p>
    </div>
  )
}
