import { useEffect, useState } from 'react'
import { Users, Crown, ChevronRight } from 'lucide-react'
import { getMyCommunities, getExplore } from '../services/api'
import { createCommunity } from '../services/finance'
import { money } from '../data/mockData'
import { useToast } from '../components/ui'
import CommunityDetail from './CommunityDetail'

export default function Communities({ user }) {
  const [open, setOpen] = useState(null)
  const [creating,setCreating] = useState(false)
  const [form,setForm] = useState({name:'',minimumContribution:'100',contributionFrequency:'WEEKLY'})
  const [error,setError] = useState('')
  const [toast, show] = useToast()
  const [mine, setMine] = useState([]); const [explore, setExplore] = useState([])
  const refresh = () => getMyCommunities().then(setMine).catch(e=>setError(e.message))
  useEffect(() => { refresh(); getExplore().then(setExplore).catch(e=>setError(e.message)) }, [])
  const addCommunity=async(e)=>{e.preventDefault();setError('');try{await createCommunity({...form,minimumContribution:String(form.minimumContribution),defaultLoanInterestRate:'0.10'});setCreating(false);setForm({name:'',minimumContribution:'100',contributionFrequency:'WEEKLY'});await refresh();show('Community created')}catch(e){setError(e.message)}}
  if (open) return <CommunityDetail c={open} user={user} onBack={() => setOpen(null)} />
  return (
    <div className="space-y-10">
      {toast}
      <header className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Communities</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Save together, lend together.</p></div>
        <button onClick={()=>setCreating(x=>!x)} className="rounded-full bg-chuma-600 px-4 py-2 text-sm font-semibold text-white">{creating?'Cancel':'Create group'}</button>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {creating && <form onSubmit={addCommunity} className="space-y-3 rounded-3xl bg-white p-5 shadow-sm dark:bg-[#241616]">
        <h2 className="font-semibold">New community</h2>
        <input required minLength={2} placeholder="Community name" className="w-full rounded-xl border p-3 text-stone-900" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input required type="number" min="1" step="0.01" placeholder="Minimum contribution (ZMW)" className="w-full rounded-xl border p-3 text-stone-900" value={form.minimumContribution} onChange={e=>setForm({...form,minimumContribution:e.target.value})}/>
        <select className="w-full rounded-xl border p-3 text-stone-900" value={form.contributionFrequency} onChange={e=>setForm({...form,contributionFrequency:e.target.value})}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="FLEXIBLE">Flexible</option></select>
        <button type="submit" className="rounded-full bg-chuma-600 px-5 py-2 font-semibold text-white">Create community</button>
      </form>}

      <section>
        <h2 className="mb-3 text-lg font-bold">Explore communities</h2>
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
          {explore.map((c) => (
            <div key={c.id} className="w-64 shrink-0 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-chuma-100 dark:bg-[#241616] dark:ring-white/10">
              <h3 className="font-bold">{c.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400"><Users size={14} /> {c.member_count} members, {c.spots_left} spots open</p>
              {c.product && <p className="mt-1 text-xs font-semibold text-chuma-600">Saving for {c.product}</p>}
              <p className="mt-3 text-sm">{money(c.contribution)} <span className="text-stone-500">{c.frequency.toLowerCase()}</span></p>
              <button onClick={() => show(`Join request sent to ${c.name}`)} className="mt-4 w-full rounded-full bg-chuma-50 py-2 text-sm font-semibold text-chuma-700 hover:bg-chuma-100 dark:bg-chuma-900 dark:text-chuma-100">Request to join</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your communities</h2>
        {mine.length===0 && <p className="text-sm text-stone-500">No communities yet. Create your first savings group above.</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {mine.map((c) => (
            <button key={c.id} onClick={() => setOpen(c)} className="group rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-chuma-100 transition hover:shadow-lg dark:bg-[#241616] dark:ring-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">{c.name} {c.role === 'admin' && <Crown size={15} className="text-gold" />}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{c.member_count} members, {money(c.contribution)} {c.frequency.toLowerCase()}</p>
                </div>
                <div className="rounded-2xl bg-chuma-600 px-3 py-2 text-right text-white">
                  <p className="text-[11px] text-white/80">Lending funds</p>
                  <p className="font-bold">{money(c.loanable_funds)}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-chuma-50 p-3 dark:bg-white/5"><p className="text-stone-500 dark:text-stone-400">Total savings</p><p className="text-lg font-bold">{money(c.total_savings)}</p></div>
                <div className="rounded-2xl bg-chuma-50 p-3 dark:bg-white/5"><p className="text-stone-500 dark:text-stone-400">Outstanding loans</p><p className="text-lg font-bold">{money(c.outstanding_loans)}</p></div>
              </div>
              <p className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-chuma-600">Open community <ChevronRight size={16} /></p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
