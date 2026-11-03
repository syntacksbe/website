import { CATEGORIES, GAMES } from './catalog.js'
import { LEVELS } from './format.js'
import { typeInfo } from './types/registry.js'
import { RANKS, rankFor } from './progress.js'
import { Stars } from './Player.jsx'
import { WeeklyCard } from './Leaderboard.jsx'
import { misses } from './misses.js'
import { trophies } from './trophies.js'
import { ACHIEVEMENTS, useGame } from '../game.jsx'
import './extras.css'

const FOOT = { demo: 'Simulation', speed: '60 seconds', hotseat: '10 questions' }

export default function Catalog({ progress, filter, setFilter }) {
  const { category, level } = filter
  const earned = GAMES.reduce((n, g) => n + progress.starsOf(g), 0)
  const max = GAMES.length * 3
  const rank = rankFor(earned)
  const nextRank = RANKS.find((r) => r.min > earned)
  const resume = GAMES.find((g) => !progress.played(g)) ?? GAMES.find((g) => progress.starsOf(g) < 3)
  const shown = CATEGORIES.filter((c) => !category || c.id === category)
  const missed = misses().length
  const { has } = useGame()
  const cabinet = [...trophies(progress), ...ACHIEVEMENTS.map((a) => ({ earned: has(a.id) }))]
  const cabinetPct = Math.round((cabinet.filter((t) => t.earned).length / cabinet.length) * 100)

  return (
    <>
      <section className="ar-hero">
        <div className="container">
          <p className="kicker">Syntacks Arcade</p>
          <h1>Learn Salesforce by playing</h1>
          <p className="ar-hero-sub">
            {GAMES.length} short games in {CATEGORIES.length} categories. Real scenarios from client work, a few minutes each, and an explanation after every answer.
          </p>
          <div className="ar-hero-row">
            <div className="ar-rank">
              <span className="level-badge" aria-hidden="true">{RANKS.indexOf(rank) + 1}</span>
              <div className="arcade-xp">
                <strong>{rank.name}</strong>
                <span className="gauge-bar xp-bar"><span style={{ width: `${(earned / max) * 100}%` }} /></span>
                <small>⭐ {earned}/{max} stars{nextRank ? ` · ${nextRank.min - earned} to ${nextRank.name}` : ' · max rank'}</small>
              </div>
            </div>
            <a className="ar-daily-link" href="#/daily">🟩 Daily Sforcle<small>Guess today’s Salesforce word</small></a>
            <a className="ar-daily-link ar-x-paths-link" href="#/paths">🗺️ Learning paths<small>Road to Admin, Developer, CPQ…</small></a>
            {resume && (
              <a className="btn btn-primary" href={`#/play/${resume.id}`}>
                {GAMES.some(progress.played) ? 'Continue' : 'Start playing'}: {resume.title} →
              </a>
            )}
          </div>
          <div className="ar-x-strip">
            <WeeklyCard progress={progress} />
            <nav className="ar-x-hub" aria-label="More in the Arcade">
              <a href="#/leaderboard"><span aria-hidden="true">🏆</span> Weekly leaderboard<small>Where you stand this week</small></a>
              <a href="#/trophies"><span aria-hidden="true">🏅</span> Trophy cabinet<small>{cabinetPct}% complete</small></a>
              <a href="#/shop"><span aria-hidden="true">⚙️</span> Shop<small>Backgrounds, card borders and radio stations</small></a>
              {missed > 0 && <a href="#/review" className="review"><span aria-hidden="true">🔁</span> Review {missed} miss{missed === 1 ? '' : 'es'}<small>Replay the rounds you got wrong</small></a>}
            </nav>
          </div>
        </div>
      </section>

      <div className="ar-filters">
        <div className="container ar-filters-inner">
          <div className="ar-chips" role="group" aria-label="Category">
            <button type="button" aria-pressed={!category} onClick={() => setFilter({ ...filter, category: null })}>All</button>
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} aria-pressed={category === c.id} onClick={() => setFilter({ ...filter, category: c.id })}>
                <span aria-hidden="true">{c.icon}</span> {c.title}
              </button>
            ))}
          </div>
          <div className="ar-chips ar-levels" role="group" aria-label="Level">
            {[null, 1, 2, 3].map((l) => (
              <button type="button" key={l ?? 'all'} aria-pressed={level === l} onClick={() => setFilter({ ...filter, level: l })}>
                {l ? LEVELS[l] : 'All levels'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container ar-catalog">
        {shown.map((c) => {
          const games = c.games.filter((g) => !level || g.level === level)
          const stars = c.games.reduce((n, g) => n + progress.starsOf(g), 0)
          if (!games.length) return null
          return (
            <section className="ar-category" key={c.id} id={`cat-${c.id}`}>
              <header>
                <span className="ar-category-icon" aria-hidden="true">{c.icon}</span>
                <div>
                  <h2>{c.title}</h2>
                  <p>{c.blurb}</p>
                </div>
                <span className="ar-category-stars">⭐ {stars}/{c.games.length * 3}</span>
              </header>
              <ul className="ar-grid">
                {games.map((g) => {
                  const s = progress.starsOf(g)
                  return (
                    <li key={g.id}>
                      <a className={`ar-tile${s === 3 ? ' gold' : ''}${['demo', 'speed', 'hotseat', 'escape'].includes(g.type) ? ` special ar-k-${g.type}` : ''}`} href={`#/play/${g.id}`}>
                        <span className="ar-tile-top">
                          <span className="ar-type">{typeInfo(g.type).icon} {typeInfo(g.type).label}</span>
                          <span className={`ar-level l${g.level}`}>{LEVELS[g.level]}</span>
                        </span>
                        <strong>{g.title}</strong>
                        <small>{g.blurb}</small>
                        <span className="ar-tile-foot">
                          <Stars n={s} />
                          <span>{FOOT[g.type] ?? `${g.n} ${g.type === 'escape' ? 'locks' : 'rounds'}`} · {progress.played(g) ? 'Play again' : 'Play'} ▶</span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
