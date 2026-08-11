import { motion } from 'framer-motion'
import { HomeIcon, GroupsIcon, ProfileIcon } from './icons'

const items = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'groups', label: 'Groups', Icon: GroupsIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
]

export default function BottomNav({ active, onChange }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white flex justify-around items-center py-3 px-2 border-t border-black/5">
      {items.map(({ key, label, Icon }) => {
        const isActive = active === key
        return (
          <motion.button
            key={key}
            onClick={() => onChange(key)}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="relative w-11 h-11 flex items-center justify-center">
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--ink)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <span
                className="relative transition-colors"
                style={{ color: isActive ? 'var(--accent)' : '#b3b3b3' }}
              >
                <Icon />
              </span>
            </span>
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: isActive ? 'var(--ink)' : '#b3b3b3' }}
            >
              {label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
