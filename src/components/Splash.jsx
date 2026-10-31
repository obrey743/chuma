import { useEffect, useState } from 'react'
export default function Splash({ onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 2200)
    const b = setTimeout(onDone, 2700)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [onDone])
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-chuma-500 to-chuma-700 px-6 transition-opacity duration-500 ${out ? 'opacity-0' : 'opacity-100'}`}>
      <img src="/chumalogo.png" alt="CHUMA" className="pop w-64 rounded-[2rem] shadow-2xl shadow-black/30 sm:w-80" />
      <p className="text-center text-lg font-medium text-white/95 sm:text-xl">Save today for a better tomorrow</p>
    </div>
  )
}
