import { useState } from 'react'
import { NAV } from './nav'
const intro = { id: 'hi', label: 'Welcome to CHUMA', icon: null, tip: 'A quick tour of the four tabs, so you know where everything lives. It takes under a minute.' }
export default function Onboarding({ onFinish }) {
  const steps = [intro, ...NAV]
  const [i, setI] = useState(0)
  const s = steps[i]; const last = i === steps.length - 1; const Icon = s.icon
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-chuma-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div key={i} className="pop w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl dark:bg-[#241616]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-chuma-50 text-chuma-600 dark:bg-chuma-900 dark:text-chuma-200">
          {Icon ? <Icon size={30} /> : <img src="/chumalogo.png" alt="" className="h-12 w-12 rounded-2xl object-cover" />}
        </div>
        <h2 className="text-xl font-bold">{s.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{s.tip}</p>
        <div className="my-6 flex justify-center gap-1.5">
          {steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-chuma-600' : 'w-1.5 bg-chuma-200'}`} />)}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onFinish} className="px-3 py-2 text-sm font-medium text-stone-500 hover:text-chuma-600">Skip tour</button>
          <button onClick={() => (last ? onFinish() : setI(i + 1))} className="rounded-full bg-chuma-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-chuma-600/30 hover:bg-chuma-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chuma-600">
            {last ? 'Start saving' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
