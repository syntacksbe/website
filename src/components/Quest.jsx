import { useContext } from 'react'
import { ACHIEVEMENTS, DemoContext, useGame } from '../game.jsx'

// Numbered step tracker shown at the top of each demo, with a hint for the current step and the
// demo's badges: earned ones lit, locked ones with what it takes to earn them.
export default function Quest({ steps, current, hint }) {
  const demo = useContext(DemoContext)
  const { has } = useGame()
  const badges = ACHIEVEMENTS.filter((a) => a.demo === demo)
  const earned = badges.filter((a) => has(a.id)).length

  return (
    <div className="quest">
      <ol>
        {steps.map((label, i) => (
          <li key={label} className={i < current ? 'done' : i === current ? 'current' : ''}>
            <span aria-hidden="true">{i < current ? '✓' : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {hint && <p className="quest-hint" key={hint} role="status">👉 {hint}</p>}
      {badges.length > 0 && (
        <div className="quest-badges">
          <p>🏅 Badges in this game · {earned}/{badges.length}</p>
          <ul>
            {badges.map((a) => (
              <li key={a.id} className={has(a.id) ? 'on' : ''}>
                <span className="quest-badge-icon" aria-hidden="true">{has(a.id) ? a.icon : '🔒'}</span>
                <span>
                  <strong>{a.title}{has(a.id) && <span className="sr-only"> (earned)</span>}</strong>
                  <small>{a.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
