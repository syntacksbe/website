import { useEffect, useState } from 'react'
import { gameById, loadGame } from './catalog.js'
import { misses } from './misses.js'
import { ROUNDS } from './rounds.jsx'
import { PLUGINS } from './types/registry.js'
import { shuffle } from './modes.jsx'
import { Finish, Rounds } from './Player.jsx'
import { beep } from './fx.js'
import './extras.css'

// #/review: a practice game built from the rounds the player got wrong (src/arcade/misses.js),
// the most recent first, mixed types. A round answered right here leaves the list.
const SIZE = 10

export async function buildReview(list = misses()) {
  const recent = [...list].reverse()
  const picked = []
  const cache = {}
  for (const m of recent) {
    if (picked.length >= SIZE) break
    const meta = gameById(m.g)
    if (!meta) continue
    const game = (cache[m.g] ??= await loadGame(meta).catch(() => null))
    const round = game?.rounds?.[m.r]
    const type = game?.type === 'escape' ? round?.type : game?.type
    if (!round || !(ROUNDS[type] || PLUGINS[type]?.Round)) continue
    picked.push({ ...round, type, buckets: round.buckets ?? game.buckets, src: { g: m.g, r: m.r }, from: game.title })
  }
  if (!picked.length) return null
  return { id: 'review', type: 'review', title: 'Review your misses', blurb: 'Rounds you got wrong, one more time.', level: 2, rounds: shuffle(picked) }
}

export default function Review() {
  const [run, setRun] = useState(0)
  const [game, setGame] = useState(undefined) // undefined while loading, null when there is nothing to review
  const [result, setResult] = useState(null)
  const left = misses().length

  useEffect(() => {
    let live = true
    setGame(undefined)
    setResult(null)
    buildReview().then((g) => live && setGame(g), () => live && setGame(null))
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => {
      live = false
    }
  }, [run])

  function finish(r) {
    beep(r.stars === 3 ? 'win' : 'good')
    setResult({ ...r, line: `${r.line} · ${misses().length} miss${misses().length === 1 ? '' : 'es'} left to review` })
  }

  return (
    <div className="container ar-player">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-player-head">
        <h1>Review your misses</h1>
        <p>Up to {SIZE} rounds you got wrong in classic, boss and escape games. Get one right and it leaves your list.</p>
        {game && !result && <p className="ar-tags"><span className="ar-type">🔁 {left} miss{left === 1 ? '' : 'es'} saved</span></p>}
      </header>
      {game === undefined ? (
        <section className="demo-panel ar-finish"><p className="ar-finish-note">Loading your misses…</p></section>
      ) : game === null ? (
        <section className="demo-panel ar-finish">
          <span className="hc-stamp good">All clear</span>
          <p className="ar-finish-note">Nothing to review. Every round you missed has been answered right since.</p>
          <a className="btn btn-primary btn-sm" href="#/">Play more games</a>
        </section>
      ) : result ? (
        <Finish game={game} result={result} onAgain={misses().length ? () => setRun((n) => n + 1) : null} againLabel="🔁 Review again" />
      ) : (
        <Rounds key={run} game={game} mode="classic" onFinish={finish} />
      )}
    </div>
  )
}
