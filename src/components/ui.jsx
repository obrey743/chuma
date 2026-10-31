import { useState, useCallback } from 'react'
export const Card = ({ children, className = '' }) => (
  <div className={`rounded-3xl bg-white p-6 shadow-sm ring-1 ring-chuma-100 dark:bg-[#241616] dark:ring-white/10 ${className}`}>{children}</div>
)
export const Field = ({ label, ...p }) => (
  <label className="block text-sm font-semibold">{label}
    <input {...p} className="mt-1.5 w-full rounded-2xl border border-chuma-100 bg-chuma-50/50 px-4 py-3 text-sm font-normal outline-none focus:border-chuma-500 focus:ring-2 focus:ring-chuma-200 dark:border-white/10 dark:bg-white/5" />
  </label>
)
const V = {
  solid: 'bg-chuma-600 text-white shadow-lg shadow-chuma-600/25 hover:bg-chuma-700',
  soft: 'bg-chuma-50 text-chuma-700 hover:bg-chuma-100 dark:bg-chuma-900 dark:text-chuma-100',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200',
}
export const Btn = ({ variant = 'solid', className = '', ...p }) => (
  <button {...p} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${V[variant]} ${className}`} />
)
export function useToast() {
  const [m, setM] = useState('')
  const show = useCallback((t) => { setM(t); setTimeout(() => setM(''), 2200) }, [])
  const node = m && <div className="pop fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full bg-chuma-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">{m}</div>
  return [node, show]
}
export const Select = ({ label, children, ...p }) => (
  <label className="block text-sm font-semibold">{label}
    <select {...p} className="mt-1.5 w-full rounded-2xl border border-chuma-100 bg-chuma-50/50 px-4 py-3 text-sm font-normal outline-none focus:border-chuma-500 focus:ring-2 focus:ring-chuma-200 dark:border-white/10 dark:bg-[#241616]">{children}</select>
  </label>
)
