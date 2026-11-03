import { gameById } from './catalog.js'
import { LEVELS } from './format.js'
import { PATHS } from './paths.js'
import { typeInfo } from './types/registry.js'
import { Stars } from './Player.jsx'
import './extras.css'

// Learning paths (#/paths) and the progress map of one path (#/path/<id>).

// Every stop with its stars and state: done (a star or more), next (the first one not done) or
// ahead (looks locked, still playable).
export function pathProgress(path, starsOf) {
  const games = path.games.map(gameById).filter(Boolean)
  let next = -1
  const stops = games.map((game, i) => {
    const stars = starsOf(game)
    if (stars === 0 && next < 0) next = i
    return { game, stars, state: stars > 0 ? 'done' : i === next ? 'next' : 'ahead' }
  })
  const done = stops.filter((s) => s.state === 'done').length
  return { stops, done, total: stops.length, complete: done === stops.length, next: stops[next] ?? null }
}

const playHref = (game, path) => `#/play/${game.id}?path=${path.id}`

export function Paths({ progress }) {
  return (
    <div className="container ar-x-page">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-x-head">
        <p className="kicker">Learning paths</p>
        <h1>Pick your road</h1>
        <p>Guided routes through the Arcade, from Rookie to Expert. Earn a star on every stop to finish a road and unlock its badge.</p>
      </header>
      <ul className="ar-x-paths">
        {PATHS.map((path) => {
          const p = pathProgress(path, progress.starsOf)
          const stars = p.stops.reduce((n, s) => n + s.stars, 0)
          return (
            <li key={path.id}>
              <a className={`ar-x-path-card${p.complete ? ' complete' : ''}`} href={`#/path/${path.id}`}>
                <span className="ar-x-path-icon" aria-hidden="true">{path.icon}</span>
                <span className="ar-x-path-text">
                  <strong>{path.title}</strong>
                  <small>{path.blurb}</small>
                  <span className="ar-x-meter" aria-hidden="true"><i style={{ width: `${(p.done / p.total) * 100}%` }} /></span>
                  <span className="ar-x-path-foot">
                    <span>{p.complete ? '🏅 Complete' : `${p.done}/${p.total} stops`} · ⭐ {stars}/{p.total * 3}</span>
                    <b>{p.complete ? 'See badge' : p.done ? 'Continue' : 'Start'} →</b>
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function PathBadge({ path, earned }) {
  return (
    <div className={`ar-x-badge${earned ? ' earned' : ''}`} role="img" aria-label={earned ? `${path.badge} badge earned` : `${path.badge} badge, not earned yet`}>
      <span className="ar-x-badge-ring">
        <span className="ar-x-badge-core">
          <span className="ar-x-badge-icon" aria-hidden="true">{path.icon}</span>
          <strong>{path.badge}</strong>
          <small>{earned ? 'Road complete' : 'Finish line'}</small>
        </span>
      </span>
    </div>
  )
}

export function PathMap({ path, progress }) {
  if (!path) {
    return (
      <div className="container ar-x-page">
        <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/paths">← Learning paths</a></nav>
        <p className="ar-help">That path doesn’t exist (any more). Pick another road.</p>
      </div>
    )
  }
  const p = pathProgress(path, progress.starsOf)
  return (
    <div className="container ar-x-page">
      <nav className="ar-crumbs" aria-label="Breadcrumb">
        <a href="#/">← Catalog</a>
        <span aria-hidden="true">/</span>
        <a href="#/paths">Learning paths</a>
      </nav>
      <header className="ar-x-head ar-x-path-head">
        <div>
          <p className="kicker">{path.icon} Learning path · {p.total} stops</p>
          <h1>{path.title}</h1>
          <p>{path.blurb}</p>
          <p className="ar-x-path-stats">
            <span><b>{p.done}</b>/{p.total} stops</span>
            <span>⭐ <b>{p.stops.reduce((n, s) => n + s.stars, 0)}</b>/{p.total * 3}</span>
          </p>
          {p.next && <a className="btn btn-primary" href={playHref(p.next.game, path)}>{p.done ? 'Next stop' : 'Start the road'}: {p.next.game.title} →</a>}
        </div>
        {p.complete && <PathBadge path={path} earned />}
      </header>

      {p.complete && <p className="ar-x-complete" role="status">🏁 Road complete. Replay any stop to push it to three stars.</p>}

      <ol className="ar-x-road" style={{ '--done': p.done / p.total }}>
        {p.stops.map(({ game, stars, state }, i) => (
          <li key={game.id} className={`ar-x-stop ${state}`}>
            <a href={playHref(game, path)} aria-label={`Stop ${i + 1}: ${game.title}${state === 'done' ? `, ${stars} stars` : state === 'next' ? ', next up' : ''}`}>
              <span className="ar-x-dot" aria-hidden="true">{state === 'done' ? '✓' : state === 'next' ? '▶' : i + 1}</span>
              <span className="ar-x-stop-card">
                <span className="ar-tile-top">
                  <span className="ar-type">{typeInfo(game.type).icon} {typeInfo(game.type).label}</span>
                  <span className={`ar-level l${game.level}`}>{LEVELS[game.level]}</span>
                </span>
                <strong>{game.title}</strong>
                <span className="ar-x-stop-foot">
                  <Stars n={stars} />
                  <span>{state === 'next' ? 'Next up ▶' : state === 'done' ? 'Replay' : '🔒 Ahead · play anyway'}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div className="ar-x-finish">
        <PathBadge path={path} earned={p.complete} />
      </div>
    </div>
  )
}
