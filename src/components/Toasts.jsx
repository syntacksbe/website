import { useEffect } from 'react'
import { useGame } from '../game.jsx'

const CONFETTI_COLORS = ['#ff5a1f', '#ffb21a', '#22c55e', '#f59e0b', '#e5484d', '#0f7b7b']

// A burst of CSS confetti pieces; positions are deterministic per index so renders stay pure.
function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2
        const dist = 60 + (i % 3) * 22
        return (
          <i
            key={i}
            style={{
              '--x': `${Math.cos(angle) * dist}px`,
              '--y': `${Math.sin(angle) * dist - 20}px`,
              '--r': `${i * 47}deg`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
          />
        )
      })}
    </span>
  )
}

export default function Toasts() {
  const { toasts, dismiss } = useGame()

  // Show each toast for a few seconds, oldest first.
  useEffect(() => {
    if (!toasts.length) return
    const timer = setTimeout(() => dismiss(toasts[0].uid), 4200)
    return () => clearTimeout(timer)
  }, [toasts, dismiss])

  return (
    <div className="toasts" aria-live="polite">
      {toasts.slice(0, 3).map((t) => (
        <button type="button" className="toast" key={t.uid} onClick={() => dismiss(t.uid)}>
          <span className="toast-icon" aria-hidden="true">
            {t.icon}
            <Confetti />
          </span>
          <span>
            <small>{t.label}</small>
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
