import { ACHIEVEMENTS, useGame } from '../game.jsx'
import { trophies } from './trophies.js'
import './extras.css'

// #/trophies: every achievement on the site in one cabinet. Arcade trophies are computed from
// progress (trophies.js); homepage badges are the demo achievements saved by src/game.jsx.

function Shelf({ title, note, items }) {
  const earned = items.filter((t) => t.earned).length
  return (
    <section className="ar-x-shelf">
      <header>
        <h2>{title}</h2>
        <span className="ar-category-stars">{earned}/{items.length}</span>
      </header>
      {note && <p className="ar-x-shelf-note">{note}</p>}
      <ul className="ar-x-trophies">
        {items.map((t) => (
          <li key={t.id} className={t.earned ? 'earned' : 'locked'}>
            <span className="ar-x-trophy-icon" aria-hidden="true"><i>{t.icon}</i></span>
            <strong>{t.title}</strong>
            <small>{t.text}</small>
            {t.earned ? (
              <span className="ar-x-trophy-state">✓ Earned</span>
            ) : t.goal ? (
              <span className="ar-x-trophy-state">
                <span className="ar-x-meter" aria-hidden="true"><i style={{ width: `${Math.min(1, t.goal[0] / t.goal[1]) * 100}%` }} /></span>
                {Math.min(t.goal[0], t.goal[1])}/{t.goal[1]}
              </span>
            ) : (
              <span className="ar-x-trophy-state">🔒 Locked</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Trophies({ progress }) {
  const { has } = useGame()
  const arcade = trophies(progress)
  const badges = ACHIEVEMENTS.map((a) => ({ ...a, earned: has(a.id) }))
  const all = [...arcade, ...badges]
  const earned = all.filter((t) => t.earned).length
  const pct = Math.round((earned / all.length) * 100)

  return (
    <div className="container ar-x-page">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-x-head ar-x-cabinet-head">
        <div>
          <p className="kicker">Trophy cabinet</p>
          <h1>{earned ? 'Your trophies' : 'An empty cabinet'}</h1>
          <p>Every achievement across the site: Arcade trophies and the badges from the demos on the homepage.</p>
        </div>
        <div className="ar-x-pct" role="meter" aria-label="Achievements complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ '--p': pct }}>
          <strong>{pct}%</strong>
          <small>{earned}/{all.length}</small>
        </div>
      </header>
      <Shelf title="Arcade trophies" items={arcade} />
      <Shelf title="Homepage badges" note={<>Earned in the interactive demos on the <a href="../">homepage</a> and in the Arcade simulations.</>} items={badges} />
    </div>
  )
}
