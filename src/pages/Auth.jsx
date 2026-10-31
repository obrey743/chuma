import { useState } from 'react'
import { Field, Btn } from '../components/ui'
import { startSession } from '../services/auth'
import { loginAccount, registerAccount, demoLogin } from '../services/finance'
import { resetDemo } from '../services/demo'

const toViewUser = (user) => ({ id:user.id, name:[user.firstName,user.lastName].filter(Boolean).join(' '), email:user.email, phone:user.phoneNumber })
export default function Auth({ onAuth }) {
  const [mode,setMode] = useState('in')
  const [f,setF] = useState({name:'',email:'',phone:'',password:''})
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false)
  const set=(key)=>(e)=>setF(prev=>({...prev,[key]:e.target.value}))
  const up=mode==='up'
  const submit=async(e)=>{
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (up && (!f.name.trim() || !f.phone.trim())) throw new Error('Add your name and phone number')
      const result = up ? await registerAccount(f) : await loginAccount(f)
      const user = toViewUser(result.user); startSession(user,result.tokens); onAuth(user)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  // Demo mode: sample data, no account or database needed. The server token lets the AI Planner use real Gemma.
  const demo=async()=>{
    setErr(''); setBusy(true); resetDemo()
    let result=null
    try { result=await demoLogin() } catch { /* server unreachable: everything except the AI still works */ }
    const user=toViewUser(result?.user||{id:'demo',firstName:'Mwila',lastName:'Banda',email:'demo@chuma.app',phoneNumber:'+260970000000'})
    startSession(user,result?.tokens||null,true); setBusy(false); onAuth(user)
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-chuma-500 to-chuma-700 p-5">
      <div className="pop w-full max-w-md">
        <img src="/chumalogo.png" alt="CHUMA" className="mx-auto mb-6 w-48 rounded-[1.75rem] shadow-2xl shadow-black/30" />
        <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-7 shadow-2xl dark:bg-[#241616]">
          <div className="grid grid-cols-2 rounded-full bg-chuma-50 p-1 dark:bg-white/5">
            {[['in','Sign in'],['up','Sign up']].map(([m,l])=><button type="button" key={m} onClick={()=>{setMode(m);setErr('')}} className={`rounded-full py-2 text-sm font-semibold ${mode===m?'bg-chuma-600 text-white shadow':'text-chuma-700 dark:text-chuma-100'}`}>{l}</button>)}
          </div>
          {up && <Field label="Full name" value={f.name} onChange={set('name')} autoComplete="name" />}
          <Field label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="email" />
          {up && <Field label="Phone number" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" />}
          <Field label="Password" type="password" value={f.password} onChange={set('password')} autoComplete={up?'new-password':'current-password'} />
          {up && <p className="text-xs text-stone-500">Use at least 10 characters for your password.</p>}
          {err && <p role="alert" className="text-sm font-medium text-chuma-600">{err}</p>}
          <Btn type="submit" disabled={busy} className="w-full py-3">{busy?'Connecting...':up?'Create account':'Sign in'}</Btn>
          <div className="flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200 dark:bg-white/10" />or<span className="h-px flex-1 bg-stone-200 dark:bg-white/10" /></div>
          <Btn type="button" variant="soft" onClick={demo} disabled={busy} className="w-full py-3">Try the demo</Btn>
          <p className="text-center text-xs text-stone-500">No account needed. Uses sample data, no real money.</p>
        </form>
      </div>
    </div>
  )
}
