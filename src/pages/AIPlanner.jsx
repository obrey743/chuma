import { useState, useEffect } from 'react'
import { Sun, Smartphone, Snowflake, Tractor, ShoppingBasket, ImagePlus, Sparkles, Plus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Card, Field, Btn, useToast } from '../components/ui'
import { analyzeProduct, savingsGoal, recommendPlan } from '../services/api'
import { money, catalogue } from '../data/mockData'

const ICONS = { sun: Sun, phone: Smartphone, fridge: Snowflake, farm: Tractor, basket: ShoppingBasket }
const inWeeks = (n) => new Date(Date.now() + n * 7 * 864e5).toISOString().slice(0, 10)
const load = () => JSON.parse(localStorage.getItem('chuma_planner_goals') || '[]')

export default function AIPlanner() {
  const [toast, show] = useToast()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(null)
  const [img, setImg] = useState(null)
  const [ai, setAi] = useState(null)
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(inWeeks(12))
  const [saved, setSaved] = useState(420)
  const [goals, setGoals] = useState(load)
  const keep = (g) => { setGoals(g); localStorage.setItem('chuma_planner_goals', JSON.stringify(g)) }

  const pick = (p) => { setName(p.name); setPrice(p.price); setIcon(p.icon); setImg(null); setAi(null) }
  const upload = (e) => { const f = e.target.files[0]; if (f) { setImg({ file: f, url: URL.createObjectURL(f) }); setIcon(null); setName(''); setPrice(''); setAi(null) } }
  const analyse = async () => {
    setBusy(true)
    try { const r = await analyzeProduct(img.file); setAi(r); setName(r.product_name); if (r.detected_price) setPrice(r.detected_price) }
    catch (e) { show(e.message) }
    setBusy(false)
  }

  const P = Number(price), S = Number(saved) || 0
  const ready = P > 0 && date && new Date(date) > new Date()
  const weeks = ready ? Math.max(1, Math.ceil((new Date(date) - Date.now()) / (7 * 864e5))) : 0
  const remaining = Math.max(0, P - S)
  const weekly = ready ? Math.ceil(remaining / weeks) : 0
  const pct = P ? Math.min(100, Math.round((S / P) * 100)) : 0
  const data = ready ? Array.from({ length: weeks + 1 }, (_, w) => ({ w, saved: Math.min(P, S + weekly * w) })) : []
  const R = 52, C = 2 * Math.PI * R

  // Ask Gemma to explain the plan. Waits until the user stops typing for a moment.
  const [explanation, setExplanation] = useState(null)
  const [explaining, setExplaining] = useState(false)
  useEffect(() => {
    setExplanation(null)
    if (!ready || remaining <= 0) return
    let cancelled = false
    const t = setTimeout(async () => {
      setExplaining(true)
      try {
        const plan = await recommendPlan({ product_name: name || 'this product', target_price: P, saved_amount: S, duration_weeks: weeks, currency: 'ZMW' })
        if (!cancelled && plan) setExplanation(plan.explanation)
      } catch { /* keep the default text if Gemma is unavailable */ }
      if (!cancelled) setExplaining(false)
    }, 800)
    return () => { cancelled = true; clearTimeout(t); setExplaining(false) }
  }, [ready, name, P, S, weeks, remaining])

  const createGoal = async () => {
    try { await savingsGoal({ product_name: name, target_amount: P, saved_amount: S, weekly_amount: weekly, duration_weeks: weeks, target_date: date }) } catch (e) { return show(e.message) }
    keep([...goals, { id: Date.now(), name, price: P, saved: S, weekly, date }]); show('Savings goal created')
  }

  return (
    <div className="space-y-8">
      {toast}
      <header><h1 className="text-2xl font-extrabold">AI Planner</h1><p className="text-sm text-stone-500 dark:text-stone-400">Choose what you are saving for. Gemma 4 helps identify it, and you confirm the price.</p></header>

      <section>
        <h2 className="mb-3 font-bold">Pick a product or upload your own</h2>
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
          {catalogue.map((p) => { const I = ICONS[p.icon]; return (
            <button key={p.id} onClick={() => pick(p)} className={`w-44 shrink-0 rounded-3xl p-4 text-left ring-1 transition ${name === p.name && icon ? 'bg-chuma-600 text-white ring-chuma-600' : 'bg-white ring-chuma-100 hover:shadow-md dark:bg-[#241616] dark:ring-white/10'}`}>
              <I size={26} /><p className="mt-3 font-bold">{p.name}</p><p className="text-xs opacity-80">{p.note}</p><p className="mt-2 font-bold">{money(p.price)}</p>
            </button>) })}
          <label className="flex w-44 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-chuma-200 p-4 text-center text-sm font-semibold text-chuma-700 dark:border-white/20 dark:text-chuma-100">
            <ImagePlus size={26} /> Upload your own
            <input type="file" accept="image/*" className="sr-only" onChange={upload} />
          </label>
        </div>
      </section>

      {img && (
        <Card className="flex flex-wrap items-center gap-5">
          <img src={img.url} alt="Uploaded product" className="h-28 w-28 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            {!ai ? <><p className="mb-3 text-stone-500 dark:text-stone-400">Gemma 4 will look at your photo and suggest what it is.</p><Btn onClick={analyse} disabled={busy} className="inline-flex items-center gap-1.5"><Sparkles size={16} />{busy ? 'Analysing...' : 'Analyse with Gemma'}</Btn></>
              : <div className="space-y-1"><p className="text-lg font-bold">{ai.product_name}</p><p>{ai.product_category}, {ai.description}</p>{ai.specifications.length > 0 && <p className="text-stone-500">{ai.specifications.join(' · ')}</p>}<p className="text-stone-500">{ai.detected_price ? 'Price found in the photo. Please confirm it below.' : 'No price found in the photo, so please enter it below.'}</p></div>}
          </div>
        </Card>
      )}

      {(name || img) && (
        <Card>
          <h2 className="mb-4 font-bold">Your goal{name && `: ${name}`}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Confirmed price (K)" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Field label="Already in your wallet (K)" type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
            <Field label="Target purchase date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </Card>
      )}

      {ready && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="-rotate-90"><circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="stroke-chuma-100 dark:stroke-white/10" /><circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" strokeLinecap="round" stroke="#c42f2f" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} /></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold">{pct}%</span><span className="text-xs text-stone-500">of goal</span></div>
              </div>
              {img && <img src={img.url} alt="" className="mt-4 h-16 w-16 rounded-2xl object-cover" />}
              <p className="mt-3 text-center font-bold">{name}</p>
            </Card>
            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              {[['Target', money(P)], ['In wallet', money(S)], ['Still to save', money(remaining)], ['Recommended weekly', money(weekly)], ['Estimated period', `${weeks} weeks`], ['Buy by', new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })]].map(([l, v], i) => (
                <Card key={l} className={`!p-4 ${i === 3 ? '!bg-chuma-600 !text-white' : ''}`}><p className={`text-xs ${i === 3 ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>{l}</p><p className="text-xl font-extrabold">{v}</p></Card>
              ))}
            </div>
          </div>
          <Card>
            <h2 className="mb-1 font-bold">Projected progress</h2>
            <p className="mb-3 text-sm text-stone-600 dark:text-stone-300">{explanation || `Save ${money(weekly)} each week for ${weeks} weeks to buy ${name} by your target date. You already have ${pct}% of the price.`}</p>
            <p className="mb-3 flex items-center gap-1.5 text-xs text-stone-500"><Sparkles size={12} />{explaining ? 'Gemma is writing an explanation...' : explanation ? 'Explained by Gemma 4. The amounts are calculated in the app.' : 'The amounts are calculated in the app.'}</p>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c42f2f" stopOpacity=".35" /><stop offset="100%" stopColor="#c42f2f" stopOpacity="0" /></linearGradient></defs><XAxis dataKey="w" tickFormatter={(w) => `W${w}`} fontSize={12} axisLine={false} tickLine={false} /><YAxis hide domain={[0, P]} /><Tooltip formatter={(v) => money(v)} labelFormatter={(w) => `Week ${w}`} /><ReferenceLine y={P} stroke="#e2b24c" strokeDasharray="5 5" /><Area type="monotone" dataKey="saved" stroke="#c42f2f" strokeWidth={3} fill="url(#g)" /></AreaChart></ResponsiveContainer></div>
            <Btn onClick={createGoal} className="mt-4">Create savings goal</Btn>
          </Card>
        </section>
      )}

      {goals.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">My savings goals</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((g) => { const p = Math.min(100, Math.round((g.saved / g.price) * 100)); return (
              <Card key={g.id}>
                <div className="flex items-center justify-between"><p className="font-bold">{g.name}</p><span className="text-sm text-stone-500">by {g.date}</span></div>
                <div className="my-3 h-2.5 overflow-hidden rounded-full bg-chuma-100 dark:bg-white/10"><div className="h-full rounded-full bg-chuma-600" style={{ width: `${p}%` }} /></div>
                <div className="flex items-center justify-between text-sm"><span>{money(g.saved)} of {money(g.price)}</span>
                  <Btn variant="soft" className="inline-flex items-center gap-1 !px-3 !py-1.5" onClick={() => keep(goals.map((x) => (x.id === g.id ? { ...x, saved: Math.min(x.price, x.saved + x.weekly) } : x)))}><Plus size={14} /> Add {money(g.weekly)}</Btn></div>
              </Card>) })}
          </div>
        </section>
      )}
    </div>
  )
}
