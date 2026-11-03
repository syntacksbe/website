import { useEffect, useState } from 'react'
import { beep } from '../arcade/fx.js'
import { onSignal } from './store.js'

// GTA-style banners across the screen, one at a time: "side quest complete", "heat lost", "cheat activated". They never block the page (pointer-events: none) and are read out politely.
const SHOW = { mission: 2600, pass: 3200, cheat: 3200, fail: 3200 }

export default function Banners() {
  const [queue, setQueue] = useState([])
  const now = queue[0]

  useEffect(() => onSignal('banner', (b) => setQueue((q) => (q.length > 4 ? q : [...q, b]))), [])

  useEffect(() => {
    if (!now) return
    if (now.tone === 'pass' || now.tone === 'cheat') beep('win')
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), SHOW[now.tone] ?? 2800)
    return () => clearTimeout(timer)
  }, [now])

  return (
    <div className="gta-banners" aria-live="polite">
      {now && (
        <div className={`gta-banner ${now.tone ?? 'mission'}`} key={now.id}>
          {now.kicker && <small>{now.kicker}</small>}
          <strong>{now.title}</strong>
          {now.line && <span>{now.line}</span>}
        </div>
      )}
    </div>
  )
}
