import { useState } from 'react'
import { Field, Btn } from '../components/ui'
import { getAccount, saveAccount, startSession } from '../services/auth'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const up = mode === 'up'
  const done = (a) => { startSession(); onAuth(a) }

  const submit = (e) => {
    e.preventDefault()
    if (!/\S+@\S+\.\S+/.test(f.email)) return setErr('Enter a valid email address.')
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.')
    if (up) {
      if (!f.name.trim() || !f.phone.trim()) return setErr('Add your name and phone number.')
      const a = { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password }
      saveAccount(a); return done(a)
    }
    const a = getAccount()
    if (!a) return setErr('No account found on this device. Sign up first.')
    if (a.email !== f.email.trim() || a.password !== f.password) return setErr('Email or password is incorrect.')
    done(a)
  }
  const demo = () => {
    const a = { name: 'Mwila Banda', email: 'mwila@example.com', phone: '+260 97 000 0000', password: 'chuma123' }
    saveAccount(a); done(a)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-chuma-500 to-chuma-700 p-5">
      <div className="pop w-full max-w-md">
        <img src="/chumalogo.png" alt="CHUMA" className="mx-auto mb-6 w-48 rounded-[1.75rem] shadow-2xl shadow-black/30" />
        <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-7 shadow-2xl dark:bg-[#241616]">
          <div className="grid grid-cols-2 rounded-full bg-chuma-50 p-1 dark:bg-white/5">
            {[['in', 'Sign in'], ['up', 'Sign up']].map(([m, l]) => (
              <button type="button" key={m} onClick={() => { setMode(m); setErr('') }} className={`rounded-full py-2 text-sm font-semibold ${mode === m ? 'bg-chuma-600 text-white shadow' : 'text-chuma-700 dark:text-chuma-100'}`}>{l}</button>
            ))}
          </div>
          {up && <Field label="Full name" value={f.name} onChange={set('name')} autoComplete="name" />}
          <Field label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="email" />
          {up && <Field label="Phone number" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" />}
          <Field label="Password" type="password" value={f.password} onChange={set('password')} autoComplete={up ? 'new-password' : 'current-password'} />
          {err && <p role="alert" className="text-sm font-medium text-chuma-600">{err}</p>}
          <Btn type="submit" className="w-full py-3">{up ? 'Create account' : 'Sign in'}</Btn>
          <button type="button" onClick={demo} className="w-full text-sm font-medium text-stone-500 hover:text-chuma-600">Try the demo account</button>
        </form>
      </div>
    </div>
  )
}
