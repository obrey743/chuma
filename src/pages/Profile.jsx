import { useState } from 'react'
import { Sun, Moon, Monitor, Plus, X, LogOut, Info } from 'lucide-react'
import { Card, Field, Btn, useToast } from '../components/ui'
import { getSession } from '../services/auth'
import { updateAccount } from '../services/finance'
import { money } from '../data/mockData'

const opts = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]
const load = () => JSON.parse(localStorage.getItem('chuma_goals') || '[]')

export default function Profile({ user, setUser, theme, setTheme, replayTour, logout }) {
  const [toast, show] = useToast()
  const [d, setD] = useState({ name: user.name, email: user.email, phone: user.phone })
  const [pw, setPw] = useState({ cur: '', next: '', again: '' })
  const [goals, setGoals] = useState(load)
  const [g, setG] = useState({ title: '', amount: '', date: '' })
  const [about, setAbout] = useState(false)

  const saveDetails = async (e) => {
    e.preventDefault()
    const parts = d.name.trim().split(/\s+/)
    try { const updated=await updateAccount({firstName:parts.shift()||'',lastName:parts.join(' ')||'-',phoneNumber:d.phone})
      const view={id:updated.id,name:`${updated.firstName} ${updated.lastName}`,email:updated.email,phone:updated.phoneNumber}
      setUser(view); show('Profile updated on the server')
    } catch(err){ show(err.message) }
  }
  const savePw = (e) => {e.preventDefault(); show('Password change is not enabled on the API yet. No changes made.')}
  const store = (n) => { setGoals(n); localStorage.setItem('chuma_goals', JSON.stringify(n)) }
  const addGoal = (e) => {
    e.preventDefault()
    if (!g.title.trim() || !(Number(g.amount) > 0)) return show('Add a goal name and amount')
    store([...goals, { ...g, id: Date.now() }]); setG({ title: '', amount: '', date: '' })
  }

  return (
    <div className="max-w-xl space-y-6">
      {toast}
      <h1 className="text-2xl font-extrabold">Profile</h1>

      <Card>
        <form onSubmit={saveDetails} className="space-y-4">
          <h2 className="font-bold">Your details</h2>
          <Field label="Full name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <Field label="Email (contact support to change)" type="email" value={d.email} disabled />
          <Field label="Phone number" type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
          <Btn type="submit">Save details</Btn>
        </form>
      </Card>

      <Card>
        <form onSubmit={savePw} className="space-y-4">
          <h2 className="font-bold">Change password</h2>
          <Field label="Current password" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} autoComplete="current-password" />
          <Field label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          <Field label="Repeat new password" type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" />
          <Btn type="submit">Update password</Btn>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {opts.map(([v, l, I]) => (
            <button key={v} onClick={() => setTheme(v)} className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-sm font-semibold ${theme === v ? 'bg-chuma-600 text-white' : 'bg-chuma-50 text-chuma-700 dark:bg-white/5 dark:text-chuma-100'}`}><I size={18} />{l}</button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">Personal goals</h2>
        {goals.length === 0 && <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">No goals yet. Add one below, like school fees or a new phone.</p>}
        <ul className="mb-4 space-y-2">
          {goals.map((x) => (
            <li key={x.id} className="flex items-center justify-between rounded-2xl bg-chuma-50 px-4 py-3 text-sm dark:bg-white/5">
              <span><b>{x.title}</b>, {money(x.amount)}{x.date && ` by ${x.date}`}</span>
              <button aria-label={`Remove ${x.title}`} onClick={() => store(goals.filter((y) => y.id !== x.id))}><X size={16} /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={addGoal} className="space-y-3">
          <Field label="Goal" value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (K)" type="number" min="1" value={g.amount} onChange={(e) => setG({ ...g, amount: e.target.value })} />
            <Field label="Target date" type="date" value={g.date} onChange={(e) => setG({ ...g, date: e.target.value })} />
          </div>
          <Btn type="submit" variant="soft" className="inline-flex items-center gap-1.5"><Plus size={16} /> Add goal</Btn>
        </form>
      </Card>

      <Card>
        <button onClick={() => setAbout(!about)} className="flex w-full items-center gap-2 font-bold"><Info size={18} /> About CHUMA</button>
        {about && <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">CHUMA brings the village bank (chilimba) online. Save with your community, lend to each other and plan purchases together, with every contribution visible to the group. Version 0.2, demo build.</p>}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Btn variant="soft" onClick={replayTour}>Replay the tour</Btn>
        <Btn variant="danger" onClick={logout} className="inline-flex items-center gap-1.5"><LogOut size={16} /> Log out</Btn>
      </div>
    </div>
  )
}
