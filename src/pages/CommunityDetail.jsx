import { useState } from 'react'
import { ArrowLeft, Crown, HandCoins, Bell, Send, Vote, ImagePlus, Trash2, Check, Clock, Lock, ChevronUp, ChevronDown, UserPlus, Wallet, X, ExternalLink } from 'lucide-react'
import { Card, Btn, Field, Select, useToast } from '../components/ui'
import { checkout } from '../services/api'
import { money } from '../data/mockData'

const DATES = ['28 Oct', '29 Oct', '30 Oct', '31 Oct']
const METHODS = ['MTN Mobile Money', 'Airtel Money', 'Zamtel Money', 'Visa / Mastercard']
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default function CommunityDetail({ c, user, onBack }) {
  const adminIdx = c.role === 'admin' ? 0 : 1
  const meName = c.members[0]
  const init = c.members.map((name, i) => ({ name, paid: i % 3 !== 2, admin: i === adminIdx }))
  const [members, setMembers] = useState(init)
  const [holderName, setHolderName] = useState(c.members[1] || c.members[0])
  const [recent, setRecent] = useState(init.filter((m) => m.paid).slice(0, 4).map((m, i) => ({ name: m.name, amount: c.contribution, date: DATES[i] })))
  const [extra, setExtra] = useState(0)
  const [payOpen, setPayOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [newMember, setNewMember] = useState('')
  const [tab, setTab] = useState('overview')
  const [closed, setClosed] = useState(false)
  const [banner, setBanner] = useState(null)
  const [rules, setRules] = useState('1. Pay by the 5th of each month.\n2. Loans are repaid within 3 months.\n3. Be respectful in the group chat.')
  const [msgs, setMsgs] = useState([
    { id: 1, who: init[1]?.name || 'Member', text: 'Reminder: contributions are due on 5 Nov.' },
    { id: 2, who: init[0].name, poll: { q: 'Move the meeting to Saturday?', opts: [{ t: 'Yes', v: 3 }, { t: 'No', v: 1 }], voted: null } },
  ])
  const [text, setText] = useState('')
  const [pollOpen, setPollOpen] = useState(false)
  const [poll, setPoll] = useState({ q: '', opts: '' })
  const [toast, show] = useToast()

  const isAdmin = c.role === 'admin'
  const holder = members.findIndex((m) => m.name === holderName)
  const unpaid = members.filter((m) => !m.paid)
  const paidCount = members.length - unpaid.length
  const tabs = [['overview', 'Overview'], ['chat', 'Chat'], ['people', 'Members and rules'], ...(isAdmin ? [['admin', 'Admin']] : [])]

  const onPaid = (amt) => {
    setMembers((ms) => ms.map((m) => (m.name === meName ? { ...m, paid: true } : m)))
    setRecent((r) => [{ name: meName, amount: amt, date: 'Today' }, ...r]); setExtra((x) => x + amt)
  }
  const move = (i, d) => { const a = [...members]; [a[i], a[i + d]] = [a[i + d], a[i]]; setMembers(a); show('Rotation updated') }
  const addMember = (e) => {
    e.preventDefault(); const n = newMember.trim()
    if (!n) return show('Enter the new member\'s name')
    if (members.some((m) => m.name.toLowerCase() === n.toLowerCase())) return show('That member is already in the group')
    setMembers([...members, { name: n, paid: false, admin: false }]); setNewMember(''); show(`${n} added`)
  }
  const removeMember = (name) => {
    const rest = members.filter((m) => m.name !== name); setMembers(rest)
    if (name === holderName) setHolderName(rest[0]?.name || '')
    show(`${name} removed`)
  }
  const send = (e) => { e.preventDefault(); if (!text.trim() || closed) return; setMsgs([...msgs, { id: Date.now(), who: user.name, text }]); setText('') }
  const addPoll = (e) => {
    e.preventDefault()
    const o = poll.opts.split(',').map((t) => t.trim()).filter(Boolean)
    if (!poll.q.trim() || o.length < 2) return show('Add a question and at least 2 options')
    setMsgs([...msgs, { id: Date.now(), who: user.name, poll: { q: poll.q, opts: o.map((t) => ({ t, v: 0 })), voted: null } }])
    setPoll({ q: '', opts: '' }); setPollOpen(false)
  }
  const vote = (id, k) => setMsgs(msgs.map((m) => m.id !== id || m.poll.voted !== null ? m
    : { ...m, poll: { ...m.poll, voted: k, opts: m.poll.opts.map((o, i) => (i === k ? { ...o, v: o.v + 1 } : o)) } }))

  return (
    <div className="space-y-6">
      {toast}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-chuma-500 to-chuma-700 p-6 pt-16 text-white sm:pt-24" style={banner ? { backgroundImage: `linear-gradient(to top, rgba(74,21,21,.85), rgba(0,0,0,.1)), url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <button onClick={onBack} className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur"><ArrowLeft size={16} /> Back</button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold">{c.name} {closed && <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-xs"><Lock size={12} /> Closed</span>}</h1>
            <p className="text-sm text-white/85">{members.length} members, {money(c.contribution)} {c.frequency.toLowerCase()}, next due 5 Nov</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl bg-white px-4 py-2.5 text-right text-chuma-700 shadow-lg"><p className="text-xs font-medium">Lending funds</p><p className="text-xl font-extrabold">{money(c.loanable_funds + extra)}</p></div>
            <button onClick={() => setPayOpen(true)} disabled={closed} className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-bold text-chuma-900 shadow-lg disabled:opacity-50"><Wallet size={16} /> Contribute to this chilimba</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-chuma-600 text-white' : 'bg-chuma-50 text-chuma-700 dark:bg-white/5 dark:text-chuma-100'}`}>{l}</button>)}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[['Total savings', money(c.total_savings + extra)], ['Lending wallet', money(c.loanable_funds + extra)], ['Outstanding loans', money(c.outstanding_loans)], ['Pot this round', money(c.contribution * members.length)]].map(([l, v]) => (
              <Card key={l} className="!p-4"><p className="text-xs text-stone-500 dark:text-stone-400">{l}</p><p className="text-xl font-extrabold">{v}</p></Card>
            ))}
          </div>
          {unpaid.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-chuma-600 p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold"><Bell size={18} /> {unpaid.length} member{unpaid.length > 1 && 's'} yet to contribute: {unpaid.map((m) => m.name).join(', ')}</p>
              <button onClick={() => show(`Reminder sent to ${unpaid.length} member${unpaid.length > 1 ? 's' : ''}`)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-chuma-700">Send reminder</button>
            </div>
          )}
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="font-bold">Wallet contributions</h2><span className="text-sm text-stone-500">{paidCount} of {members.length} paid</span></div>
              <Btn variant="soft" disabled={closed} onClick={() => setPayOpen(true)} className="inline-flex items-center gap-1.5"><Wallet size={16} /> Add to wallet</Btn>
            </div>
            <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-chuma-100 dark:bg-white/10"><div className="h-full rounded-full bg-chuma-600" style={{ width: `${pct(paidCount, members.length)}%` }} /></div>
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-sm"><span>{m.name}</span>
                  {m.paid ? <span className="flex items-center gap-1 font-semibold text-green-600"><Check size={15} /> Paid {money(c.contribution)}</span> : <span className="flex items-center gap-1 font-semibold text-chuma-600"><Clock size={15} /> Due</span>}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-1 font-bold">Proposed rotation</h2>
            <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">Who receives the pot, in order.</p>
            <ol className="space-y-2">
              {members.map((m, i) => (
                <li key={m.name} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${i === holder ? 'bg-gold/20 ring-1 ring-gold' : 'bg-chuma-50 dark:bg-white/5'}`}>
                  <span className="font-semibold">{i + 1}. {m.name}</span>
                  {i === holder ? <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-gold"><HandCoins size={18} /> Has the pot now</span> : <span className="text-stone-500">{i < holder ? 'Received' : 'Waiting'}</span>}
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Recent contributions</h2>
            <ul className="space-y-2 text-sm">
              {recent.slice(0, 6).map((r, i) => <li key={i} className="flex justify-between"><span>{r.name}</span><span className="text-stone-500">{money(r.amount)}, {r.date}</span></li>)}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'chat' && (
        <Card>
          <div className="mb-4 max-h-[26rem] space-y-3 overflow-y-auto">
            {msgs.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.who === user.name ? 'items-end' : 'items-start'}`}>
                <span className="mb-0.5 text-xs text-stone-500">{m.who}</span>
                {m.poll ? (
                  <div className="w-full max-w-sm rounded-2xl bg-chuma-50 p-4 dark:bg-white/5">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold"><Vote size={16} /> {m.poll.q}</p>
                    {(() => { const tot = m.poll.opts.reduce((a, o) => a + o.v, 0); return m.poll.opts.map((o, k) => (
                      <button key={k} onClick={() => vote(m.id, k)} disabled={m.poll.voted !== null} className="relative mb-2 block w-full overflow-hidden rounded-xl bg-white px-3 py-2 text-left text-sm dark:bg-black/20">
                        {m.poll.voted !== null && <span className="absolute inset-y-0 left-0 bg-chuma-200/70 dark:bg-chuma-700/50" style={{ width: `${pct(o.v, tot)}%` }} />}
                        <span className="relative flex justify-between font-medium"><span>{o.t}{m.poll.voted === k && ' (your vote)'}</span>{m.poll.voted !== null && <span>{pct(o.v, tot)}%</span>}</span>
                      </button>)) })()}
                  </div>
                ) : <p className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.who === user.name ? 'bg-chuma-600 text-white' : 'bg-chuma-50 dark:bg-white/5'}`}>{m.text}</p>}
              </div>
            ))}
          </div>
          {pollOpen && (
            <form onSubmit={addPoll} className="mb-3 space-y-3 rounded-2xl bg-chuma-50 p-4 dark:bg-white/5">
              <Field label="Poll question" value={poll.q} onChange={(e) => setPoll({ ...poll, q: e.target.value })} />
              <Field label="Options, separated by commas" value={poll.opts} onChange={(e) => setPoll({ ...poll, opts: e.target.value })} />
              <Btn type="submit">Post poll</Btn>
            </form>
          )}
          <form onSubmit={send} className="flex gap-2">
            <button type="button" aria-label="Create a poll" onClick={() => setPollOpen(!pollOpen)} className="rounded-full bg-chuma-50 p-3 text-chuma-700 dark:bg-white/5"><Vote size={18} /></button>
            <input value={text} onChange={(e) => setText(e.target.value)} disabled={closed} placeholder={closed ? 'This community is closed' : 'Message the group'} className="min-w-0 flex-1 rounded-full border border-chuma-100 bg-chuma-50/50 px-4 text-sm outline-none focus:border-chuma-500 dark:border-white/10 dark:bg-white/5" />
            <button aria-label="Send" disabled={closed} className="rounded-full bg-chuma-600 p-3 text-white disabled:opacity-50"><Send size={18} /></button>
          </form>
        </Card>
      )}

      {tab === 'people' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-bold">Members</h2>
            <ul className="space-y-3 text-sm">
              {members.map((m, i) => (
                <li key={m.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-chuma-100 font-bold text-chuma-700">{m.name[0]}</span>
                  <span className="flex-1 font-medium">{m.name}</span>
                  {m.admin && <Crown size={16} className="text-gold" />}
                  {i === holder && <HandCoins size={18} className="text-amber-600" aria-label="Has the pot" />}
                </li>
              ))}
            </ul>
          </Card>
          <Card><h2 className="mb-3 font-bold">Community rules</h2><p className="whitespace-pre-line text-sm leading-relaxed">{rules}</p></Card>
        </div>
      )}

      {tab === 'admin' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold">Banner picture</h2>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-chuma-50 px-5 py-2.5 text-sm font-semibold text-chuma-700 dark:bg-chuma-900 dark:text-chuma-100">
              <ImagePlus size={16} /> Choose image
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files[0]; if (f) { setBanner(URL.createObjectURL(f)); show('Banner updated') } }} />
            </label>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Rules</h2>
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={5} className="w-full rounded-2xl border border-chuma-100 bg-chuma-50/50 p-4 text-sm outline-none focus:border-chuma-500 dark:border-white/10 dark:bg-white/5" />
            <Btn className="mt-3" onClick={() => show('Rules saved')}>Save rules</Btn>
          </Card>
          <Card>
            <h2 className="mb-1 font-bold">Edit rotation</h2>
            <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">Move members up or down, and choose who has the pot now.</p>
            <ol className="space-y-2">
              {members.map((m, i) => (
                <li key={m.name} className="flex items-center gap-2 rounded-2xl bg-chuma-50 px-3 py-2 text-sm dark:bg-white/5">
                  <span className="flex-1 font-semibold">{i + 1}. {m.name}</span>
                  {i === holder ? <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-gold"><HandCoins size={16} /> Has the pot</span>
                    : <button onClick={() => { setHolderName(m.name); show(`${m.name} now has the pot`) }} className="text-xs font-semibold text-chuma-600">Give the pot</button>}
                  <button aria-label={`Move ${m.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full p-1.5 disabled:opacity-30"><ChevronUp size={18} /></button>
                  <button aria-label={`Move ${m.name} down`} disabled={i === members.length - 1} onClick={() => move(i, 1)} className="rounded-full p-1.5 disabled:opacity-30"><ChevronDown size={18} /></button>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Add or remove members</h2>
            <form onSubmit={addMember} className="mb-4 flex items-end gap-2">
              <div className="flex-1"><Field label="New member's name" value={newMember} onChange={(e) => setNewMember(e.target.value)} /></div>
              <Btn type="submit" className="inline-flex items-center gap-1.5 !py-3"><UserPlus size={16} /> Add</Btn>
            </form>
            <ul className="space-y-2 text-sm">
              {members.filter((m) => !m.admin).map((m) => (
                <li key={m.name} className="flex items-center justify-between">{m.name}
                  <button aria-label={`Remove ${m.name}`} onClick={() => removeMember(m.name)} className="text-chuma-600"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-1 font-bold">{closed ? 'Reopen community' : 'Close community'}</h2>
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">{closed ? 'Members can chat and contribute again.' : 'Chat and new contributions stop until you reopen it.'}</p>
            <Btn variant={closed ? 'soft' : 'danger'} onClick={() => (closed ? setClosed(false) : setConfirmClose(true))}>{closed ? 'Reopen community' : 'Close community'}</Btn>
          </Card>
        </div>
      )}

      {confirmClose && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-chuma-900/60 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" className="pop w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl dark:bg-[#241616]">
            <h2 className="text-lg font-bold">Are you sure?</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Closing {c.name} stops chat and new contributions for every member. You can reopen it later.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Btn variant="soft" onClick={() => setConfirmClose(false)}>Cancel</Btn>
              <Btn onClick={() => { setClosed(true); setConfirmClose(false); show('Community closed') }}>Yes, close it</Btn>
            </div>
          </div>
        </div>
      )}
      {payOpen && <PayModal c={c} onClose={() => setPayOpen(false)} onPaid={onPaid} />}
    </div>
  )
}

function PayModal({ c, onClose, onPaid }) {
  const [amount, setAmount] = useState(c.contribution)
  const [method, setMethod] = useState(METHODS[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (!(Number(amount) > 0)) return setErr('Enter an amount above K0')
    setBusy(true)
    try { const r = await checkout({ community_id: c.id, member_id: 'me', amount: Number(amount), payment_method: method }); setRes(r); onPaid(Number(amount)) }
    catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-chuma-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="pop w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl dark:bg-[#241616]">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Contribute to {c.name}</h2><button aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        {res ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-base font-bold text-green-600"><Check size={20} /> {money(amount)} added to the group wallet</p>
            <p className="text-stone-500 dark:text-stone-400">You now show as paid. Reference {res.transaction_id}. In live mode this is confirmed once DevDraft verifies the payment.</p>
            <a href={res.checkout_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-chuma-600">Open checkout <ExternalLink size={14} /></a>
            <Btn onClick={onClose} className="w-full py-3">Done</Btn>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label={`Amount (agreed: ${money(c.contribution)} ${c.frequency.toLowerCase()})`} type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
            {err && <p role="alert" className="text-sm font-medium text-chuma-600">{err}</p>}
            <Btn type="submit" disabled={busy} className="w-full py-3">{busy ? 'Creating checkout...' : 'Pay now'}</Btn>
          </form>
        )}
      </div>
    </div>
  )
}
