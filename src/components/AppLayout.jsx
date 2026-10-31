import { NAV } from './nav'
import { isDemo } from '../services/auth'
export default function AppLayout({ tab, setTab, children }) {
  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-2 border-r border-chuma-100 bg-white/80 p-5 backdrop-blur md:flex dark:border-white/10 dark:bg-[#1d1212]/80">
        <img src="/chumalogo.png" alt="CHUMA" className="mb-6 w-full rounded-3xl shadow-md" />
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${tab === id ? 'bg-chuma-600 text-white shadow-lg shadow-chuma-600/25' : 'text-stone-600 hover:bg-chuma-50 dark:text-stone-300 dark:hover:bg-white/5'}`}>
            <Icon size={20} /> {label}
          </button>
        ))}
      </aside>
      <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 md:pb-10 md:pt-8">
        <img src="/chumalogo.png" alt="CHUMA" className="mb-6 w-32 rounded-2xl shadow-md md:hidden" />
        {isDemo() && <p className="mb-5 rounded-2xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">Demo mode: sample data, no real money. The AI Planner uses real Gemma 4.</p>}
        {children}
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-3xl border border-chuma-100 bg-white/90 p-1.5 shadow-xl backdrop-blur md:hidden dark:border-white/10 dark:bg-[#1d1212]/90">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} aria-label={label} className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold ${tab === id ? 'bg-chuma-600 text-white' : 'text-stone-500 dark:text-stone-400'}`}>
            <Icon size={20} /> {label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </div>
  )
}
