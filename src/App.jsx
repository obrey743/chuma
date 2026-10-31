import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Onboarding from './components/Onboarding'
import AppLayout from './components/AppLayout'
import Auth from './pages/Auth'
import Communities from './pages/Communities'
import Savings from './pages/Savings'
import AIPlanner from './pages/AIPlanner'
import Profile from './pages/Profile'
import { getSession, endSession } from './services/auth'

export default function App() {
  const [splash, setSplash] = useState(true)
  const [user, setUser] = useState(getSession)
  const [tour, setTour] = useState(() => !localStorage.getItem('chuma_tour_done'))
  const [tab, setTab] = useState('communities')
  const [nonce, setNonce] = useState(0)
  const go = (t) => { setTab(t); setNonce((n) => n + 1) } // tapping any tab, even the active one, reloads it
  const [theme, setTheme] = useState(() => localStorage.getItem('chuma_theme') || 'system')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches))
    apply(); localStorage.setItem('chuma_theme', theme)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const finishTour = () => { localStorage.setItem('chuma_tour_done', '1'); setTour(false) }
  const logout = () => { endSession(); setUser(null); setTab('communities') }

  if (splash) return <Splash onDone={() => setSplash(false)} />
  if (!user) return <Auth onAuth={setUser} />

  const pages = {
    communities: <Communities user={user} />, savings: <Savings />, planner: <AIPlanner />,
    profile: <Profile user={user} setUser={setUser} theme={theme} setTheme={setTheme} replayTour={() => setTour(true)} logout={logout} />,
  }
  return (
    <>
      <AppLayout tab={tab} setTab={go}><div key={`${tab}-${nonce}`}>{pages[tab]}</div></AppLayout>
      {tour && <Onboarding onFinish={finishTour} />}
    </>
  )
}
