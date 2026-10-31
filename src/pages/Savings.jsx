import { useState, useEffect } from 'react'
import { Wallet, HandCoins, Hourglass, X, ExternalLink, PiggyBank, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Field, Select, Btn, useToast } from '../components/ui'
import { checkout, applyForLoan, getMyCommunities } from '../services/api'
import { contributionHistory, loans as listLoans } from '../services/finance'
import { money, myCommunities, savingsHistory, monthly, myLoans, loanRequestsSeed, loanTerms, personalSeed, personalMonthly } from '../data/mockData'

const METHODS = ['MTN Mobile Money', 'Airtel Money', 'Zamtel Money', 'Visa / Mastercard']
const badge = { CONFIRMED: 'bg-green-100 text-green-700', PENDING: 'bg-amber-100 text-amber-700', ACTIVE: 'bg-chuma-100 text-chuma-700' }
const Pill = ({ s }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[s]}`}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
const Chart = ({ data }) => (
  <div className="mb-4 h-36">
    <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={12} /><Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(196,47,47,.08)' }} /><Bar dataKey="v" fill="#c42f2f" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
  </div>
)
const Stats = ({ items }) => (
  <div className="grid grid-cols-3 gap-4">
    {items.map(([I, l, v]) => <Card key={l} className="!p-4"><I size={18} className="mb-2 text-chuma-600" /><p className="text-xs text-stone-500 dark:text-stone-400">{l}</p><p className="text-lg font-extrabold sm:text-xl">{v}</p></Card>)}
  </div>
)

export default function Savings() {
  const [toast, show] = useToast()
  const [communities,setCommunities] = useState([])
  const [view, setView] = useState('personal') // a community id, or 'personal'
  const [amount, setAmount] = useState('100')
  const [method, setMethod] = useState(METHODS[0])
  const [busy, setBusy] = useState(false)
  const [co, setCo] = useState(null)
  const [history, setHistory] = useState([])
  const [requests, setRequests] = useState([])
  const [activeLoans,setActiveLoans] = useState([])
  const [modal, setModal] = useState(false)

  useEffect(()=>{getMyCommunities().then(rows=>{setCommunities(rows);if(rows.length)setView(rows[0].id)}).catch(err=>show(err.message))},[])
  useEffect(()=>{if(view==='personal')return;Promise.all([contributionHistory(view),listLoans(view)]).then(([cs,ls])=>{
    const cm=communities.find(x=>x.id===view)
    setHistory(cs.map(x=>({id:x.id,date:new Date(x.createdAt).toLocaleDateString(),community:cm?.name||view,amount:Number(x.amount),method:'Community',status:x.status})))
    setActiveLoans(ls.filter(x=>x.status==='ACTIVE').map(x=>({id:x.id,community:cm?.name||view,amount:Number(x.principal),interest:Number(x.annualInterestRate)*100,term:x.durationMonths,repaid:x.repayments.reduce((a,r)=>a+Number(r.amount),0),status:x.status,next_due:x.schedule?.[0]?.dueDate?.slice(0,10)||'-'})))
    setRequests(ls.filter(x=>x.status==='PENDING').map(x=>({id:x.id,community:cm?.name||view,amount:Number(x.principal),purpose:x.purpose,term:x.durationMonths,status:x.status,date:new Date(x.createdAt).toLocaleDateString()})))
  }).catch(err=>show(err.message))},[view,communities])
  const personal = view === 'personal'
  const c = communities.find((x) => x.id === view)
  const choose = (id) => { setView(id); setCo(null); const g = communities.find((x) => x.id === id); if (g) setAmount(g.contribution) }

  const pay = async (e) => {
    e.preventDefault()
    if (!(Number(amount) > 0)) return show('Enter an amount above K0')
    setBusy(true)
    try {
      const r = await checkout({ community_id: c.id, member_id: 'me', amount: Number(amount), payment_method: method })
      setCo(r)
      setHistory([{ id: Date.now(), date: 'Today', community: c.name, amount: Number(amount), method, status: r.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING' }, ...history])
    } catch (err) { show(err.message) }
    setBusy(false)
  }

  let g = null
  if (c) {
    const hist = history.filter((h) => h.community === c.name)
    const loans = activeLoans.filter((l) => l.community === c.name)
    const reqs = requests.filter((r) => r.community === c.name)
    g = { hist, loans, reqs,
      total: hist.filter((h) => h.status === 'CONFIRMED').reduce((a, h) => a + h.amount, 0),
      owed: loans.reduce((a, l) => a + Math.round(l.amount * (1 + l.interest / 100)) - l.repaid, 0),
      chart: monthly.map(d=>({m:d.m,v:hist.filter(x=>x.status==='CONFIRMED' && new Date(x.date).toLocaleString('en',{month:'short'})===d.m).reduce((a,x)=>a+x.amount,0)})) }
  }

  return (
    <div className="space-y-8">
      {toast}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Savings and loans</h1><p className="text-sm text-stone-500 dark:text-stone-400">Track live community accounts. Personal tracking is only an on-device demo.</p></div>
        {!personal && <Btn onClick={() => setModal(true)}>Request a loan</Btn>}
      </header>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
        {communities.map((x) => <button key={x.id} onClick={() => choose(x.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${view === x.id ? 'bg-chuma-600 text-white' : 'bg-chuma-50 text-chuma-700 dark:bg-white/5 dark:text-chuma-100'}`}><Users size={15} />{x.name}</button>)}
        <button onClick={() => choose('personal')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${personal ? 'bg-chuma-600 text-white' : 'bg-chuma-50 text-chuma-700 dark:bg-white/5 dark:text-chuma-100'}`}><PiggyBank size={15} />Personal savings</button>
      </div>

      {personal ? <Personal show={show} /> : (
        <>
          <Stats items={[[Wallet, 'Total saved here', money(g.total)], [HandCoins, 'Loan balance', money(g.owed)], [Hourglass, 'Pending requests', g.reqs.length]]} />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <form onSubmit={pay} className="space-y-4">
                <h2 className="font-bold">Contribute to {c.name}</h2>
                <Field label={`Amount (agreed: ${money(c.contribution)} ${c.frequency.toLowerCase()})`} type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
                <Btn type="submit" disabled={busy} className="w-full py-3">{busy ? 'Creating checkout...' : 'Pay now'}</Btn>
              </form>
              {co && (
                <div className="pop mt-4 rounded-2xl bg-chuma-50 p-4 text-sm dark:bg-white/5">
                  <p className="font-semibold">{co.simulated ? 'Simulated test contribution — no money moved.' : 'Checkout created. Complete payment with your provider.'}</p>
                  <p className="mt-1 text-stone-500 dark:text-stone-400">Reference {co.transaction_id}, status {co.status.toLowerCase()}. Your contribution shows as confirmed once payment is verified.</p>
                  {co.checkout_url && <a href={co.checkout_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-chuma-600">Open checkout <ExternalLink size={14} /></a>}
                </div>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-bold">Savings history</h2>
              <Chart data={g.chart} />
              {g.hist.length === 0 && <p className="text-sm text-stone-500">No contributions in this group yet.</p>}
              <ul className="space-y-2.5 text-sm">
                {g.hist.map((h) => <li key={h.id} className="flex items-center justify-between gap-2"><span><b>{money(h.amount)}</b> <span className="text-stone-500">{h.date}, {h.method}</span></span><Pill s={h.status} /></li>)}
              </ul>
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-bold">Member contributions</h2>
              <ul className="space-y-2.5 text-sm">{c.members.map((m, i) => <li key={m} className="flex justify-between"><span>{m}</span><span className="font-semibold">{money(c.contribution * (6 - (i % 2)))}</span></li>)}</ul>
            </Card>
            <Card>
              <h2 className="mb-3 font-bold">Loans</h2>
              {g.loans.length === 0 && <p className="mb-3 text-sm text-stone-500">You have no active loans in this group.</p>}
              {g.loans.map((l) => {
                const due = Math.round(l.amount * (1 + l.interest / 100)); const p = Math.round((l.repaid / due) * 100)
                return (
                  <div key={l.id} className="mb-4 rounded-2xl bg-chuma-50 p-4 text-sm dark:bg-white/5">
                    <div className="flex justify-between"><b>{money(l.amount)} at {l.interest}%, {l.term} months</b><Pill s={l.status} /></div>
                    <p className="mt-1 text-stone-500 dark:text-stone-400">Next payment {l.next_due}</p>
                    <div className="my-2 h-2 overflow-hidden rounded-full bg-chuma-100 dark:bg-white/10"><div className="h-full bg-chuma-600" style={{ width: `${p}%` }} /></div>
                    <p>{money(l.repaid)} repaid of {money(due)}</p>
                  </div>
                )
              })}
              <h3 className="mb-2 mt-2 text-sm font-bold">Requests</h3>
              {g.reqs.length === 0 && <p className="text-sm text-stone-500">No loan requests yet.</p>}
              <ul className="space-y-2 text-sm">{g.reqs.map((r) => <li key={r.id} className="flex items-center justify-between gap-2"><span><b>{money(r.amount)}</b> <span className="text-stone-500">{r.purpose}, {r.term} months, {r.date}</span></span><Pill s={r.status} /></li>)}</ul>
            </Card>
          </div>
        </>
      )}
      {modal && c && <LoanModal c={c} onClose={() => setModal(false)} onDone={(r) => { setRequests([r, ...requests]); setModal(false); show('Loan request submitted') }} />}
    </div>
  )
}

function Personal({ show }) {
  const [list, setList] = useState(personalSeed)
  const [f, setF] = useState({ type: 'DEPOSIT', amount: '', note: '' })
  const sum = (t) => list.filter((e) => e.type === t).reduce((a, e) => a + e.amount, 0)
  const bal = sum('DEPOSIT') - sum('WITHDRAWAL')
  const add = (e) => {
    e.preventDefault()
    const a = Number(f.amount)
    if (!(a > 0)) return show('Enter an amount above K0')
    if (f.type === 'WITHDRAWAL' && a > bal) return show('That is more than your balance')
    setList([{ id: Date.now(), date: 'Today', type: f.type, amount: a, note: f.note.trim() || (f.type === 'DEPOSIT' ? 'Savings' : 'Withdrawal') }, ...list])
    setF({ ...f, amount: '', note: '' })
  }
  return (
    <>
      <Stats items={[[PiggyBank, 'Balance', money(bal)], [Wallet, 'Total saved', money(sum('DEPOSIT'))], [HandCoins, 'Total withdrawn', money(sum('WITHDRAWAL'))]]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={add} className="space-y-4">
            <h2 className="font-bold">Add to your personal savings</h2>
            <Select label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="DEPOSIT">Money saved</option><option value="WITHDRAWAL">Money taken out</option></Select>
            <Field label="Amount (K)" type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            <Field label="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <Btn type="submit" className="w-full py-3">Save entry</Btn>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Personal history</h2>
          <Chart data={personalMonthly} />
          <ul className="space-y-2.5 text-sm">
            {list.map((e) => <li key={e.id} className="flex justify-between gap-2"><span><b>{e.note}</b> <span className="text-stone-500">{e.date}</span></span><span className={`font-semibold ${e.type === 'DEPOSIT' ? 'text-green-600' : 'text-chuma-600'}`}>{e.type === 'DEPOSIT' ? '+' : '-'}{money(e.amount)}</span></li>)}
          </ul>
        </Card>
      </div>
    </>
  )
}

function LoanModal({ c, onClose, onDone }) {
  const [f, setF] = useState({ amount: '', term: 2, purpose: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const amt = Number(f.amount)
  const total = Math.round(amt * (1 + loanTerms.interest_rate / 100))
  const submit = async (e) => {
    e.preventDefault()
    if (!(amt > 0)) return setErr('Enter the amount you need.')
    if (amt > c.loanable_funds) return setErr(`This community can lend up to ${money(c.loanable_funds)} right now.`)
    if (!f.purpose.trim()) return setErr('Tell the group what the loan is for.')
    setBusy(true)
    try {
      const r = await applyForLoan({ community_id: c.id, amount: amt, term_months: Number(f.term), purpose: f.purpose })
      onDone({ id: r.id, community: c.name, amount: amt, term: Number(f.term), purpose: f.purpose, date: 'Today', status: 'PENDING' })
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-chuma-900/60 p-4 backdrop-blur-sm sm:items-center">
      <form onSubmit={submit} className="pop w-full max-w-md space-y-4 rounded-[2rem] bg-white p-7 shadow-2xl dark:bg-[#241616]">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Request a loan from {c.name}</h2><button type="button" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        <Field label="Amount (K)" type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        <Select label="Repayment period" value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n} month{n > 1 && 's'}</option>)}</Select>
        <Field label="Purpose" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} />
        {amt > 0 && <p className="rounded-2xl bg-chuma-50 p-3 text-sm dark:bg-white/5">At {loanTerms.interest_rate}% interest you repay {money(total)}, about {money(Math.ceil(total / f.term))} a month.</p>}
        <button type="button" onClick={() => setF({ amount: 1500, term: 2, purpose: 'Buy stock for my market stall' })} className="text-sm font-medium text-chuma-600">Fill with an example</button>
        {err && <p role="alert" className="text-sm font-medium text-chuma-600">{err}</p>}
        <Btn type="submit" disabled={busy} className="w-full py-3">{busy ? 'Submitting...' : 'Submit request'}</Btn>
      </form>
    </div>
  )
}
