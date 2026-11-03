import { useEffect, useMemo, useRef, useState } from 'react'
import { beep, burst, feedback, floatText, haptic } from './fx.js'

// Ways to play beyond the classic rounds: a boss to fight, a swipe deck, a speed run and the hot seat.

export const BOSSES = {
  limits: { name: 'The Governor', icon: '👾', taunt: 'One more query and you’re mine.' },
  integration: { name: 'Timeout Titan', icon: '🤖', taunt: 'Your callouts will wait… forever.' },
  datamodel: { name: 'Data Skew Dragon', icon: '🐉', taunt: '10,000 children under one parent. Try me.' },
  service: { name: 'The SLA Reaper', icon: '💀', taunt: 'Every breached milestone feeds me.' },
  sales: { name: 'Quota Kraken', icon: '🦑', taunt: 'Your pipeline is mine to swallow.' },
  cpq: { name: 'Discount Demon', icon: '😈', taunt: 'Ninety percent off. Everything. Forever.' },
  deployment: { name: 'Friday Release', icon: '🔥', taunt: 'Deploy at 17:55. What could go wrong?' },
}

export function shuffle(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// The boss above the rounds: health bar, hearts and reactions to hits and misses.
export function BossHud({ category, hp, max, hearts, hit, hurt }) {
  const boss = BOSSES[category] ?? BOSSES.limits
  return (
    <div className={`ar-boss${hp === 0 ? ' down' : ''}`}>
      <span className={`ar-boss-face${hit ? ' hit' : ''}${hurt ? ' attack' : ''}`} key={`${hit}-${hurt}`} aria-hidden="true">{boss.icon}</span>
      <div className="ar-boss-info">
        <strong>{boss.name}</strong>
        <span className="ar-hp" role="meter" aria-label="Boss health" aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
          <i style={{ width: `${(hp / max) * 100}%` }} />
        </span>
        <small>{hp === max ? `“${boss.taunt}”` : hp === 0 ? 'Defeated!' : `${hp}/${max} HP left`}</small>
      </div>
      <span className="ar-hearts" aria-label={`${hearts} of 3 lives`}>
        {[0, 1, 2].map((i) => <i key={i} className={i < hearts ? 'on' : ''}>{i < hearts ? '❤️' : '🖤'}</i>)}
      </span>
    </div>
  )
}

// A timer that counts down in seconds while `running`; calls onEnd once at zero.
export function useCountdown(seconds, running, onEnd) {
  const [left, setLeft] = useState(seconds)
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 0.1)), 100)
    return () => clearInterval(id)
  }, [running])
  useEffect(() => {
    if (running && left <= 0) end.current?.()
    if (running && left > 0 && left <= 5 && Math.abs(left - Math.round(left)) < 0.05) beep('tick')
  }, [left, running])
  return [left, setLeft]
}

export function Timer({ left, total }) {
  return (
    <span className={`ar-timer${left <= 10 ? ' hot' : ''}${left <= 5 ? ' panic' : ''}`}>
      <i style={{ width: `${(left / total) * 100}%` }} />
      <b>⏱ {Math.ceil(left)}s</b>
    </span>
  )
}

// Swipe a deck of sort cards left or right (and up for a third bucket), against the clock.
export function SwipeDeck({ game, onFinish }) {
  const deck = useMemo(() => shuffle(game.rounds), [game])
  const [i, setI] = useState(0)
  const [results, setResults] = useState([]) // { round, ok }
  const [drag, setDrag] = useState(null) // { dx, dy }
  const [fly, setFly] = useState(null) // bucket the top card is flying to
  const [streak, setStreak] = useState(0)
  const start = useRef(null)
  const card = useRef(null)
  const over = i >= deck.length
  const [left] = useCountdown(45, !over, () => finish(results))
  const b = game.buckets

  function finish(list) {
    const correct = list.filter((r) => r.ok).length
    onFinish({ score: correct / deck.length, list, deck })
  }

  function choose(bucket) {
    if (over || fly != null) return
    const round = deck[i]
    const ok = round.bucket === bucket
    const next = [...results, { round, ok }]
    const nextStreak = ok ? streak + 1 : 0
    setFly(bucket)
    setResults(next)
    setStreak(nextStreak)
    feedback(ok ? 1 : 0, { streak: nextStreak, el: card.current })
    if (ok && nextStreak >= 3) floatText(`COMBO ×${nextStreak}`, { tone: 'combo' })
    setTimeout(() => {
      setFly(null)
      setDrag(null)
      setI((n) => n + 1)
      if (i + 1 >= deck.length) finish(next)
    }, 280)
  }

  const down = (e) => {
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => start.current && setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  const up = () => {
    if (!start.current) return
    const d = drag ?? { dx: 0, dy: 0 }
    start.current = null
    if (b.length > 2 && d.dy < -90 && Math.abs(d.dy) > Math.abs(d.dx)) choose(2)
    else if (d.dx < -90) choose(0)
    else if (d.dx > 90) choose(1)
    else setDrag(null)
  }

  const round = deck[i]
  const lean = drag ? (drag.dx < -40 ? 0 : drag.dx > 40 ? 1 : b.length > 2 && drag.dy < -40 ? 2 : null) : null
  const flyTo = { 0: 'translate(-140%, 10%) rotate(-30deg)', 1: 'translate(140%, 10%) rotate(30deg)', 2: 'translate(0, -140%)' }

  return (
    <div className="ar-swipe">
      <div className="ar-swipe-bar">
        <span className="ar-round-count">Card {Math.min(i + 1, deck.length)}/{deck.length}</span>
        <Timer left={left} total={45} />
        {streak > 1 && <span className="ar-streak">🔥 {streak}</span>}
      </div>
      <div className="ar-swipe-stage">
        <span className={`ar-swipe-label l${lean === 0 ? ' lit' : ''}`}>← {b[0]}</span>
        <span className={`ar-swipe-label r${lean === 1 ? ' lit' : ''}`}>{b[1]} →</span>
        {b[2] && <span className={`ar-swipe-label u${lean === 2 ? ' lit' : ''}`}>↑ {b[2]}</span>}
        {deck.slice(i + 1, i + 3).reverse().map((r, k, arr) => (
          <div className="ar-swipe-card back" key={r.text} style={{ '--k': arr.length - k }}>{r.text}</div>
        ))}
        {round && (
          <div
            ref={card}
            key={round.text}
            className={`ar-swipe-card top${fly != null ? ' fly' : ''}${lean != null ? ` lean${lean}` : ''}`}
            style={{ transform: fly != null ? flyTo[fly] : drag ? `translate(${drag.dx}px, ${Math.min(0, drag.dy) * 0.6}px) rotate(${drag.dx / 14}deg)` : undefined }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; setDrag(null) }}
          >
            {round.text}
          </div>
        )}
      </div>
      <div className="ar-swipe-buttons" style={{ '--n': b.length }}>
        <button type="button" onClick={() => choose(0)} disabled={over}>← {b[0]}</button>
        {b[2] && <button type="button" onClick={() => choose(2)} disabled={over}>↑ {b[2]}</button>}
        <button type="button" onClick={() => choose(1)} disabled={over}>{b[1]} →</button>
      </div>
    </div>
  )
}

const SPEED_TIME = 60

// 60 seconds of rapid-fire questions from the whole category, 3 lives, points with a combo multiplier.
export function SpeedRun({ game, onFinish }) {
  const pool = useMemo(() => shuffle(game.pool), [game])
  const [i, setI] = useState(0)
  const [lives, setLives] = useState(3)
  const [points, setPoints] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [picked, setPicked] = useState(null)
  const [ended, setEnded] = useState(false)
  const stage = useRef(null)
  const stats = useRef({})
  stats.current = { points, correct, i }
  const end = () => {
    if (ended) return
    setEnded(true)
    beep(lives > 0 ? 'win' : 'lose')
    onFinish({ points: stats.current.points, correct: stats.current.correct, asked: stats.current.i })
  }
  const [left] = useCountdown(SPEED_TIME, !ended, end)
  const q = pool[i % pool.length]

  function answer(k) {
    if (picked != null || ended) return
    setPicked(k)
    const ok = k === q.answer
    const nextStreak = ok ? streak + 1 : 0
    setStreak(nextStreak)
    feedback(ok ? 1 : 0, { streak: nextStreak, el: stage.current })
    if (ok) {
      const gain = 100 * Math.min(1 + nextStreak * 0.5, 4)
      setPoints((p) => p + gain)
      setCorrect((c) => c + 1)
      floatText(nextStreak >= 3 ? `+${gain} ×${nextStreak}` : `+${gain}`, { tone: nextStreak >= 3 ? 'combo' : 'good' })
    } else {
      floatText('−1 ❤️', { tone: 'bad' })
      setLives((l) => l - 1)
    }
    setTimeout(() => {
      setPicked(null)
      setI((n) => n + 1)
      if (!ok && lives - 1 <= 0) end()
    }, ok ? 450 : 900)
  }

  return (
    <div className="ar-speed" ref={stage}>
      <div className="ar-speed-hud">
        <Timer left={left} total={SPEED_TIME} />
        <span className="ar-points" key={points}>{points.toLocaleString('en')}</span>
        <span className="ar-hearts">{[0, 1, 2].map((k) => <i key={k} className={k < lives ? 'on' : ''}>{k < lives ? '❤️' : '🖤'}</i>)}</span>
        {streak > 1 && <span className="ar-streak">🔥 ×{streak}</span>}
      </div>
      {q && (
        <div className="ar-speed-card" key={i}>
          <p className="ar-q">{q.q}</p>
          <div className="ar-options">
            {q.options.map((o, k) => {
              const state = picked == null ? '' : k === q.answer ? ' right' : k === picked ? ' wrong' : ' dim'
              return (
                <button type="button" key={o} className={`ar-option${state}`} onClick={() => answer(k)} disabled={picked != null}>
                  <b aria-hidden="true">{'ABCD'[k]}</b>{o}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const LADDER = [100, 200, 500, 1000, 2000, 5000, 10000, 50000, 250000, 1000000]
const SAFE = [3, 6] // after question 4 (1,000) and 7 (10,000) the points are banked
// Points, never money: nobody should think there's a real prize.
export const pts = (n) => `${n.toLocaleString('en')} pts`

// Ten questions from easy to hard, a points ladder, two lifelines and a dramatic reveal.
export function HotSeat({ game, onFinish }) {
  const questions = useMemo(() => {
    const by = (l) => shuffle(game.pool.filter((q) => q.level === l))
    const picked = [...by(1).slice(0, 4), ...by(2).slice(0, 3), ...by(3).slice(0, 3)]
    const rest = shuffle(game.pool.filter((q) => !picked.includes(q)))
    return [...picked, ...rest].slice(0, 10)
  }, [game])
  const [n, setN] = useState(0)
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [fifty, setFifty] = useState(null) // hidden option indexes for this question
  const [used, setUsed] = useState({ fifty: false, call: false })
  const [call, setCall] = useState(null)
  const stage = useRef(null)
  const q = questions[n]
  const banked = SAFE.filter((s) => s < n).map((s) => LADDER[s]).pop() ?? 0
  const won = n > 0 ? LADDER[n - 1] : 0

  function lock() {
    if (choice == null || locked) return
    setLocked(true)
    beep('tick')
    // A pause before the reveal builds the tension.
    setTimeout(() => {
      setRevealed(true)
      const ok = choice === q.answer
      feedback(ok ? 1 : 0, { el: stage.current })
      if (ok) haptic([20, 40, 20])
      setTimeout(() => {
        if (!ok) return onFinish({ points: banked, reached: n, won: false })
        if (n + 1 === questions.length) {
          beep('win')
          burst({ count: 40 })
          return onFinish({ points: LADDER[n], reached: n + 1, won: true })
        }
        setN(n + 1)
        setChoice(null)
        setLocked(false)
        setRevealed(false)
        setFifty(null)
        setCall(null)
      }, ok ? 1100 : 1800)
    }, 1300)
  }

  function fiftyFifty() {
    if (used.fifty || locked) return
    const wrong = shuffle(q.options.map((_, k) => k).filter((k) => k !== q.answer)).slice(0, Math.max(0, q.options.length - 2))
    setFifty(wrong)
    setUsed({ ...used, fifty: true })
    if (wrong.includes(choice)) setChoice(null)
  }

  function callArchitect() {
    if (used.call || locked) return
    const sure = Math.random() < 0.8
    const pick = sure ? q.answer : shuffle(q.options.map((_, k) => k).filter((k) => !(fifty ?? []).includes(k)))[0]
    setCall(`“I’m ${sure ? 'pretty' : 'not totally'} sure it’s ${'ABCD'[pick]}. ${sure ? 'Go for it.' : 'Don’t quote me.'}”`)
    setUsed({ ...used, call: true })
  }

  return (
    <div className="ar-hot" ref={stage}>
      <ol className="ar-ladder" aria-label="Money ladder">
        {LADDER.map((m, k) => (
          <li key={m} className={`${k === n ? 'now' : k < n ? 'done' : ''}${SAFE.includes(k) ? ' safe' : ''}`}>
            <span>{k + 1}</span>{pts(m)}
          </li>
        )).reverse()}
      </ol>
      <div className="ar-hot-main">
        <div className="ar-hot-top">
          <span className="ar-hot-stake">Question {n + 1} for <b>{pts(LADDER[n])}</b></span>
          <span className="ar-hot-life">
            <button type="button" onClick={fiftyFifty} disabled={used.fifty || locked || q.options.length < 3}>50:50</button>
            <button type="button" onClick={callArchitect} disabled={used.call || locked}>📞 Architect</button>
          </span>
        </div>
        {call && <p className="ar-hot-call">{call}</p>}
        <p className="ar-q ar-hot-q" key={n}>{q.q}</p>
        <div className="ar-options ar-hot-options">
          {q.options.map((o, k) => {
            if (fifty?.includes(k)) return <span key={o} className="ar-option gone" aria-hidden="true" />
            const state = revealed ? (k === q.answer ? ' right' : k === choice ? ' wrong' : ' dim') : locked && k === choice ? ' locked' : k === choice ? ' chosen' : ''
            return (
              <button type="button" key={o} className={`ar-option${state}`} onClick={() => !locked && setChoice(k)} disabled={locked}>
                <b aria-hidden="true">{'ABCD'[k]}</b>{o}
              </button>
            )
          })}
        </div>
        <div className="ar-hot-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={lock} disabled={choice == null || locked}>
            {locked ? 'Final answer…' : 'Final answer'}
          </button>
          {n > 0 && !locked && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFinish({ points: won, reached: n, won: false, walked: true })}>
              Walk away with {pts(won)}
            </button>
          )}
        </div>
        {revealed && q.why && <p className="ar-hot-why">{q.why}</p>}
      </div>
    </div>
  )
}
