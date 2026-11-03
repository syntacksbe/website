import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { LINKEDIN_URL } from '../content.js'
import { DemoContext } from '../game.jsx'
import { categoryById, gameById, loadGame, nextGame, readyGame } from './catalog.js'
import { pathById } from './paths.js'
import { noteRound } from './misses.js'
import { noteFeat } from './store.js'
import { ShareCardButton } from './share.jsx'
import { LEVELS } from './format.js'
import { PLUGINS, typeInfo } from './types/registry.js'
import { starsFor } from './progress.js'
import { ROUNDS } from './rounds.jsx'
import { BOSSES, BossHud, HotSeat, SpeedRun, SwipeDeck, Timer, pts, useCountdown } from './modes.jsx'
import { beep, burst, feedback, floatText, haptic, shake } from './fx.js'
import { missionFailed, wasted } from '../gta/screens.js'
import LoadingTip from '../gta/LoadingTip.jsx'

// The homepage demos load only when a simulation is opened.
const DEMOS = {
  limits: lazy(() => import('../components/GovernorDemo.jsx')),
  integration: lazy(() => import('../components/IntegrationDemo.jsx')),
  datamodel: lazy(() => import('../components/DataModelDemo.jsx')),
  service: lazy(() => import('../components/ServiceDeskDemo.jsx')),
  sales: lazy(() => import('../components/SalesPipelineDemo.jsx')),
}

const STAMPS = [
  { label: 'Wasted', tone: 'bad' },
  { label: 'Almost there', tone: 'warn' },
  { label: 'Almost there', tone: 'warn' },
  { label: 'Mission passed', tone: 'good' },
]

const BEST_KEY = 'syntacks-arcade-best' // best points per speed run

// Keeps one broken game from taking the whole Arcade down.
class GameBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="demo-panel ar-finish">
        <p className="ar-finish-note">💥 This game hit a bug. Try another one while I fix it.</p>
        <a className="btn btn-ghost btn-sm" href="#/">Back to the catalog</a>
      </section>
    )
  }
}

export function Stars({ n, of = 3, big }) {
  return (
    <span className={`ar-stars${big ? ' big' : ''}`} aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => <i key={i} className={i < n ? 'on' : ''} style={{ '--i': i }}>★</i>)}
    </span>
  )
}

// Which ways a game can be played.
function modesFor(game) {
  if (['demo', 'speed', 'hotseat', 'escape'].includes(game.type)) return []
  const modes = [{ id: 'classic', label: '▶ Classic' }, { id: 'boss', label: '⚔️ Boss fight' }]
  if (game.type === 'sort' && game.buckets.length <= 3) modes.push({ id: 'swipe', label: '👆 Swipe' })
  return modes
}

// Where the game sits on a learning path it's played from (#/play/<id>?path=<path-id>).
function pathStop(game, path) {
  const i = path ? path.games.indexOf(game.id) : -1
  return i < 0 ? null : { path, next: gameById(path.games[i + 1]) ?? null, stop: i + 1 }
}

// Opens a game from the catalog: its header shows at once, the game as soon as its rounds are in.
export default function Player({ game, progress, pathId }) {
  const [full, setFull] = useState(() => readyGame(game))
  const [failed, setFailed] = useState(false)
  const [tries, setTries] = useState(0)

  useEffect(() => {
    if (full) return
    let live = true
    setFailed(false)
    loadGame(game).then((g) => live && setFull(g), () => live && setFailed(true))
    return () => {
      live = false
    }
  }, [game, full, tries])

  return <PlayerScreen game={full ?? game} ready={Boolean(full)} failed={failed} retry={() => setTries((n) => n + 1)} progress={progress} pathId={pathId} />
}

export function PlayerScreen({ game, ready = true, failed, retry, progress, pathId }) {
  const [run, setRun] = useState(0) // bumped by "Play again"
  const [mode, setMode] = useState('classic')
  const [result, setResult] = useState(null) // finish screen data
  const category = categoryById(game.category)
  const onPath = pathStop(game, pathById(pathId))
  const next = onPath ? onPath.next : nextGame(game)
  const modes = ready ? modesFor(game) : []

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [game.id, run])

  function finish(r) {
    progress.record(game.id, r.stars)
    if (r.bossWon) noteFeat('boss', game.id)
    if (r.stars === 3) {
      beep('win')
      burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 36 })
    } else if (r.bossWon === false) missionFailed(r.line)
    // A timed game lost: the clock ran out (escape room, speed run, swipe deck).
    else if (r.stars === 0 && (game.type === 'speed' || game.type === 'escape' || mode === 'swipe')) wasted(r.line)
    else if (r.stars === 0) beep('lose')
    setResult(r)
  }

  function again() {
    setResult(null)
    setRun((n) => n + 1)
  }

  const key = `${run}-${mode}`
  let body
  if (!ready) {
    body = (
      <section className="demo-panel ar-finish" aria-busy={!failed}>
        {failed ? <p className="ar-finish-note">📡 This game didn’t load. Check your connection and try again.</p> : <LoadingTip what="Loading the game" />}
        {failed && <button type="button" className="btn btn-primary btn-sm" onClick={retry}>↺ Try again</button>}
      </section>
    )
  } else if (game.type === 'demo') body = <DemoGame game={game} next={next} onPath={onPath} />
  else if (result) body = <Finish game={game} result={result} next={next} onPath={onPath} onAgain={again} />
  else if (game.type === 'speed') body = <SpeedRun key={key} game={game} onFinish={(r) => finish(speedResult(game, r))} />
  else if (game.type === 'hotseat') body = <HotSeat key={key} game={game} onFinish={(r) => finish(hotResult(r))} />
  else if (mode === 'swipe') body = <SwipeDeck key={key} game={game} onFinish={(r) => finish(swipeResult(r))} />
  else body = <Rounds key={key} game={game} mode={game.type === 'escape' ? 'escape' : mode} onFinish={finish} />

  return (
    <div className="container ar-player">
      <nav className="ar-crumbs" aria-label="Breadcrumb">
        <a href="#/">← Catalog</a>
        <span aria-hidden="true">/</span>
        <a href={`#/?c=${category.id}`}>{category.icon} {category.title}</a>
        {onPath && (
          <>
            <span aria-hidden="true">/</span>
            <a href={`#/path/${onPath.path.id}`}>{onPath.path.icon} {onPath.path.title} · stop {onPath.stop}/{onPath.path.games.length}</a>
          </>
        )}
      </nav>
      <header className="ar-player-head">
        <h1>{game.title}</h1>
        <p>{game.blurb}</p>
        <p className="ar-tags">
          <span className="ar-type">{typeInfo(game.type).icon} {typeInfo(game.type).label}</span>
          <span className={`ar-level l${game.level}`}>{LEVELS[game.level]}</span>
          <span className="ar-best">Best <Stars n={progress.starsOf(game)} /></span>
        </p>
        {modes.length > 1 && !result && (
          <div className="ar-modes" role="group" aria-label="How to play">
            {modes.map((m) => (
              <button type="button" key={m.id} aria-pressed={mode === m.id} onClick={() => { setMode(m.id); setRun((n) => n + 1) }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <GameBoundary key={`${game.id}-${run}-${mode}`}>{body}</GameBoundary>
    </div>
  )
}

function speedResult(game, r) {
  let best = {}
  try {
    best = JSON.parse(localStorage.getItem(BEST_KEY) || '{}')
  } catch {
    // Without storage there is no high score.
  }
  const record = r.points > (best[game.id] ?? 0)
  if (record) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...best, [game.id]: r.points }))
    } catch {
      // Ignore.
    }
  }
  const stars = r.correct >= 12 ? 3 : r.correct >= 8 ? 2 : r.correct >= 4 ? 1 : 0
  return {
    stars,
    big: r.points.toLocaleString('en'),
    unit: 'points',
    line: `${r.correct} right out of ${r.asked}${record ? ' · 🏆 new high score!' : best[game.id] ? ` · best ${best[game.id].toLocaleString('en')}` : ''}`,
    note: 'Stars: 4 right for one, 8 for two, 12 for three.',
  }
}

function hotResult(r) {
  const stars = r.won ? 3 : r.reached >= 7 ? 2 : r.reached >= 4 ? 1 : 0
  return {
    stars,
    stamp: r.won ? { label: 'Top of the ladder', tone: 'good' } : undefined,
    big: pts(r.points),
    unit: r.won ? 'you won it all' : r.walked ? 'you walked away with' : 'you leave with',
    line: `${r.reached} of 10 questions answered`,
    note: r.won ? 'Every question, no slip. Legendary.' : 'Bank 1,000 points at question 4 and 10,000 at question 7.',
  }
}

function swipeResult(r) {
  const misses = r.list.filter((x) => !x.ok).map((x) => x.round)
  const timedOut = r.deck.length - r.list.length
  return {
    stars: starsFor(r.score),
    big: `${r.list.filter((x) => x.ok).length}/${r.deck.length}`,
    unit: 'cards sorted right',
    line: timedOut ? `${timedOut} card${timedOut > 1 ? 's' : ''} left when time ran out` : 'Whole deck cleared',
    misses,
  }
}

// The next stop on a path (or back to the path after its last stop), else the next game in the catalog.
function NextLink({ next, onPath }) {
  if (onPath && !next) return <a className="btn btn-primary btn-sm" href={`#/path/${onPath.path.id}`}>🏁 Back to {onPath.path.title} →</a>
  if (!next) return null
  return onPath ? (
    <a className="btn btn-primary btn-sm" href={`#/play/${next.id}?path=${onPath.path.id}`}>Next stop: {next.title} →</a>
  ) : (
    <a className="btn btn-primary btn-sm" href={`#/play/${next.id}`}>Next game: {next.title} →</a>
  )
}

export function Finish({ game, result, next, onPath, onAgain, againLabel = '↺ Play again' }) {
  const stamp = result.stamp ?? STAMPS[result.stars]
  const card = { title: game.title, stars: result.stars, big: result.big, unit: result.unit, stamp }
  const link = game.type === 'review' ? undefined : `${window.location.href.split('#')[0]}#/play/${game.id}`
  return (
    <section className="demo-panel ar-finish">
      <span className={`hc-stamp ${stamp.tone}`}>{stamp.label}</span>
      <Stars n={result.stars} big />
      <p className="ar-score"><strong>{result.big}</strong> {result.unit}</p>
      {result.line && <p className="ar-finish-line">{result.line}</p>}
      <p className="ar-finish-note">
        {result.note ?? (result.stars === 3 ? 'Flawless. You’d pass this part of the exam.' : result.stars > 0 ? 'Good run. Play again to go for three stars.' : 'Tough one. Read the explanations and give it another go.')}
      </p>
      {result.misses?.length > 0 && (
        <details className="ar-misses">
          <summary>Review your {result.misses.length} miss{result.misses.length > 1 ? 'es' : ''}</summary>
          <ul>{result.misses.map((m) => <li key={m.text ?? m.q}><strong>{m.text ?? m.q}</strong><span>{m.why}</span></li>)}</ul>
        </details>
      )}
      <div className="sim-actions">
        <NextLink next={next} onPath={onPath} />
        {onAgain && <button type="button" className="btn btn-ghost btn-sm" onClick={onAgain}>{againLabel}</button>}
        <ShareCardButton card={card} text={`${result.big} ${result.unit} on ${game.title} in the Syntacks Arcade.`} link={link} />
        <a className="btn btn-ghost btn-sm" href="#/">Back to the catalog</a>
      </div>
      <p className="ar-cta">Need this done right in your own org? <a href={LINKEDIN_URL} target="_blank" rel="noopener">Talk to Marc on LinkedIn</a>.</p>
    </section>
  )
}

function DemoGame({ game, next, onPath }) {
  const Demo = DEMOS[game.demo]
  return (
    <>
      <p className="ar-help">Stars here follow the badges of this simulation: earn all its badges for 3 stars.</p>
      <DemoContext.Provider value={game.demo}>
        <Suspense fallback={<section className="demo-panel ar-finish"><LoadingTip what="Loading the simulation" /></section>}>
          <Demo />
        </Suspense>
      </DemoContext.Provider>
      {(next || onPath) && <p className="ar-next-line"><NextLink next={next} onPath={onPath} /></p>}
    </>
  )
}

const POINTS = 100

// The classic round-by-round game, also used for boss fights, escape rooms and the review of misses.
export function Rounds({ game, mode, onFinish }) {
  const [index, setIndex] = useState(0)
  const [scores, setScores] = useState([]) // 0–1 per finished round
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [points, setPoints] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [hit, setHit] = useState(0) // bumps to replay the boss reactions
  const [hurt, setHurt] = useState(0)
  const [over, setOver] = useState(false)
  const panel = useRef(null)
  const total = game.rounds.length
  const boss = mode === 'boss'
  const escape = mode === 'escape'
  const done = scores.length > index // this round is answered
  const round = game.rounds[Math.min(index, total - 1)]
  const review = game.type === 'review' // rounds of mixed types, each from its own game
  const type = escape || review ? round.type : game.type
  const Round = ROUNDS[type] ?? PLUGINS[type]?.Round
  const sum = scores.reduce((a, b) => a + b, 0)
  const correct = scores.filter((s) => s === 1).length
  const [left, setLeft] = useCountdown(game.time ?? 0, escape && !over, () => end(false))

  function end(won, final = scores) {
    if (over) return
    setOver(true)
    const s = final.reduce((a, b) => a + b, 0)
    const right = final.filter((x) => x === 1).length
    if (boss) {
      const stars = won ? hearts : 0
      onFinish({
        stars,
        stamp: won ? { label: 'Boss defeated', tone: 'good' } : { label: 'Wasted', tone: 'bad' },
        big: `${right}/${total}`,
        unit: 'hits landed',
        bossWon: won,
        line: won ? `${BOSSES[game.category]?.name} is down with ${hearts} ❤️ to spare · ${points.toLocaleString('en')} points` : `${BOSSES[game.category]?.name} wins this time.`,
        note: won ? (hearts === 3 ? 'Not a scratch. Flawless victory.' : 'Lose fewer hearts for more stars.') : 'Every miss costs a heart. Read the explanations and fight again.',
      })
    } else if (escape) {
      const share = left / game.time
      onFinish({
        stars: won ? (share >= 0.5 ? 3 : share >= 0.25 ? 2 : 1) : 0,
        stamp: won ? { label: 'Escaped', tone: 'good' } : { label: 'Locked in', tone: 'bad' },
        big: won ? `${Math.ceil(left)}s` : `${right}/${total}`,
        unit: won ? 'left on the clock' : 'locks opened',
        line: won ? `All ${total} locks open.` : 'The clock ran out. Wrong answers cost 20 seconds each.',
      })
    } else {
      onFinish({
        stars: starsFor(s / total),
        big: `${Math.round(s * 10) / 10}/${total}`,
        unit: 'correct',
        line: `${points.toLocaleString('en')} points${best > 1 ? ` · best streak 🔥 ${best}` : ''}`,
      })
    }
  }

  function result(score) {
    const from = round.src ?? { g: game.id, r: index } // a review round points back to its own game
    noteRound(from.g, from.r, score)
    const nextScores = [...scores, score]
    setScores(nextScores)
    const nextStreak = score === 1 ? streak + 1 : 0
    setStreak(nextStreak)
    setBest((b) => Math.max(b, nextStreak))
    feedback(score, { streak: nextStreak, el: panel.current })
    if (score > 0) {
      const gain = Math.round(POINTS * score * (1 + Math.min(nextStreak, 6) * 0.25))
      setPoints((p) => p + gain)
      floatText(nextStreak >= 3 ? `+${gain}  COMBO ×${nextStreak}` : `+${gain}`, { tone: nextStreak >= 3 ? 'combo' : 'good' })
    }
    if (boss) {
      if (score === 1) {
        setHit((n) => n + 1)
        beep('hit')
      } else {
        setHurt((n) => n + 1)
        shake(panel.current)
        haptic(120)
        if (hearts - 1 <= 0) {
          setHearts(0)
          setTimeout(() => end(false, nextScores), 900)
        } else setHearts((h) => h - 1)
      }
    }
    if (escape && score < 1) {
      setLeft((s) => Math.max(0, s - 20))
      floatText('−20s', { tone: 'bad' })
    }
  }

  function advance() {
    if (index + 1 === total || (boss && bossHp === 0)) return end(true)
    setIndex((i) => i + 1)
  }

  // You may miss twice (3 hearts), so the boss has as many hit points as rounds minus two.
  const maxHp = Math.max(2, total - 2)
  const bossHp = Math.max(0, maxHp - correct)

  return (
    <section className={`demo-panel ar-round${boss ? ' boss' : ''}${escape ? ' escape' : ''}`} ref={panel}>
      {boss && <BossHud category={game.category} hp={bossHp} max={maxHp} hearts={hearts} hit={hit} hurt={hurt} />}
      {escape && index === 0 && !done && <p className="ar-escape-story">🔦 {game.story}</p>}
      <div className="ar-round-bar">
        <span className="ar-round-count">{escape ? `Lock ${index + 1}/${total}` : `Round ${index + 1}/${total}`}</span>
        {escape ? (
          <span className="ar-locks" aria-hidden="true">
            {game.rounds.map((_, i) => <i key={i} className={i < scores.length ? 'open' : i === index ? 'now' : ''}>{i < scores.length ? '🔓' : '🔒'}</i>)}
          </span>
        ) : (
          <span className="ar-pips" aria-hidden="true">
            {game.rounds.map((_, i) => (
              <i key={i} className={i < scores.length ? (scores[i] === 1 ? 'right' : scores[i] > 0 ? 'half' : 'wrong') : i === index ? 'now' : ''} />
            ))}
          </span>
        )}
        {escape ? <Timer left={left} total={game.time} /> : <span className="ar-points" key={points}>{points.toLocaleString('en')}</span>}
        {streak > 1 && <span className="ar-streak" key={streak}>🔥 {streak}</span>}
      </div>

      <div className="ar-round-body" key={index}>
        {escape && round.story && <p className="ar-escape-step">{round.story}</p>}
        {review && <p className="ar-escape-step">🔁 From <b>{round.from}</b></p>}
        {Round ? (
          <Round round={round} game={{ ...game, type, buckets: round.buckets ?? game.buckets }} done={done} onResult={result} />
        ) : (
          <p className="ar-help">🚧 This game type is still being built. Come back soon.</p>
        )}
      </div>

      {done && !over && (boss ? hearts > 0 : true) && (
        <div className={`ar-feedback ${scores[index] === 1 ? 'right' : scores[index] > 0 ? 'half' : 'wrong'}`} role="status">
          <strong>
            {scores[index] === 1 ? (boss ? '💥 Direct hit!' : escape ? '🔓 Lock open!' : '✅ Correct!') : scores[index] > 0 ? '👍 Partly right' : boss ? '🩸 The boss strikes back' : '❌ Not quite'}
          </strong>
          {round.why && <p>{round.why}</p>}
          <button type="button" className="btn btn-primary btn-sm" onClick={advance} autoFocus>
            {boss && bossHp === 0 ? 'Finish him' : index + 1 === total ? (boss ? 'Finish him' : escape ? 'Open the door' : 'See my score') : escape ? 'Next lock →' : 'Next round →'}
          </button>
        </div>
      )}
    </section>
  )
}
