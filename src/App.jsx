import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './store'
import BottomNav from './components/BottomNav'
import Landing from './screens/Landing'
import SignUp from './screens/SignUp'
import Home from './screens/Home'
import Groups from './screens/Groups'
import CreateGroup from './screens/CreateGroup'
import GroupDetail from './screens/GroupDetail'
import AddExpense from './screens/AddExpense'
import Profile from './screens/Profile'
import JoinGroup from './screens/JoinGroup'
import Tour, { HelpButton } from './components/Tour'
import ShareView from './screens/ShareView'

const TOUR_SEEN_KEY = 'squared_tour_seen'

function parseShareParam() {
  const raw = new URLSearchParams(window.location.search).get('share')
  if (!raw) return null
  const parts = raw.split(':')
  if (parts[0] === 'expense' && parts[1] && parts[2]) {
    return { groupId: parts[1], expenseId: parts[2] }
  }
  if (parts[0] === 'group' && parts[1]) {
    return { groupId: parts[1], expenseId: null }
  }
  return null
}

const STACK_SCREENS = ['createGroup', 'group', 'addExpense', 'joinGroup']

function variantsFor(name) {
  if (STACK_SCREENS.includes(name)) {
    return {
      initial: { x: 24, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -16, opacity: 0 },
    }
  }
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  }
}

function Router() {
  const { user } = useApp()
  const [tab, setTab] = useState('home')
  // screen: { name: 'home' | 'createGroup' | 'group' | 'addExpense' | 'profile', groupId? }
  const [screen, setScreen] = useState({ name: 'home' })
  const [pastLanding, setPastLanding] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    if (user && !localStorage.getItem(TOUR_SEEN_KEY)) {
      setTourOpen(true)
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    }
  }, [user])

  if (!user) {
    return (
      <div className="app-shell">
        {pastLanding ? (
          <SignUp />
        ) : (
          <Landing onGetStarted={() => setPastLanding(true)} />
        )}
      </div>
    )
  }

  const goTab = (t) => {
    setTab(t)
    setScreen({ name: t })
  }

  let content
  if (screen.name === 'createGroup') {
    content = (
      <CreateGroup
        onBack={() => setScreen({ name: 'home' })}
        onCreated={(id) => setScreen({ name: 'group', groupId: id })}
      />
    )
  } else if (screen.name === 'group') {
    content = (
      <GroupDetail
        groupId={screen.groupId}
        onBack={() => setScreen({ name: 'home' })}
        onAddExpense={() =>
          setScreen({ name: 'addExpense', groupId: screen.groupId })
        }
        onEditExpense={(expense) =>
          setScreen({ name: 'addExpense', groupId: screen.groupId, expense })
        }
      />
    )
  } else if (screen.name === 'addExpense') {
    content = (
      <AddExpense
        groupId={screen.groupId}
        expense={screen.expense}
        onBack={() => setScreen({ name: 'group', groupId: screen.groupId })}
        onDone={() => setScreen({ name: 'group', groupId: screen.groupId })}
      />
    )
  } else if (screen.name === 'joinGroup') {
    content = (
      <JoinGroup
        onBack={() => setScreen({ name: 'home' })}
        onJoined={(id) => setScreen({ name: 'group', groupId: id })}
      />
    )
  } else if (screen.name === 'profile') {
    content = <Profile />
  } else if (screen.name === 'groups') {
    content = (
      <Groups
        onOpenGroup={(id) => setScreen({ name: 'group', groupId: id })}
        onCreateGroup={() => setScreen({ name: 'createGroup' })}
        onJoinGroup={() => setScreen({ name: 'joinGroup' })}
      />
    )
  } else {
    content = (
      <Home
        onOpenGroup={(id) => setScreen({ name: 'group', groupId: id })}
        onCreateGroup={() => setScreen({ name: 'createGroup' })}
        onJoinGroup={() => setScreen({ name: 'joinGroup' })}
      />
    )
  }

  const showNav = ['home', 'groups', 'profile'].includes(screen.name)
  const screenKey = screen.name + (screen.groupId || '') + (screen.expense?.id || '')
  const variants = variantsFor(screen.name)

  return (
    <div className="app-shell">
      <AnimatePresence initial={false}>
        <motion.div
          key={screenKey}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col"
        >
          {content}
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav active={tab} onChange={goTab} />}
      {showNav && <HelpButton onClick={() => setTourOpen(true)} />}
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  )
}

export default function App() {
  const shareParams = parseShareParam()
  if (shareParams) {
    return <ShareView params={shareParams} />
  }

  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
