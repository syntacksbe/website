import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWanted } from '../game.jsx'
import { beep, haptic } from '../arcade/fx.js'
import { useMedia } from '../useMedia.js'
import { banner, completeQuest } from './quests.js'
import { signal, writeGta } from './store.js'
import { useGtaText } from './text.js'

// Five wanted stars start a police chase: red and blue light at the screen edges, a siren on the radio
// (and in the sound effects, when they're on), and an offer to lose the heat in a small driving game.
// Winning clears the stars (they count again from here, see useWanted). "Not now" calms it for this visit.
// `?chase` in the homepage URL opens the driving game straight away, without the stars.
const LATER = 'syntacks-gta-chase-later'
const direct = () => new URLSearchParams(window.location.search).has('chase')

function laterSet() {
  try {
    return sessionStorage.getItem(LATER) === '1'
  } catch {
    return false
  }
}

export default function Chase() {
  const T = useGtaText().chase
  const { stars, raw } = useWanted()
  const [later, setLater] = useState(laterSet)
  const [ready, setReady] = useState(false) // the five-star "most wanted" card has gone
  const [game, setGame] = useState(direct)
  const chasing = stars >= 5 && !later

  useEffect(() => {
    if (!chasing) return setReady(false)
    const look = () => setReady(!document.querySelector('.most-wanted') && !document.documentElement.classList.contains('intro-open'))
    look()
    const id = setInterval(look, 1000)
    return () => clearInterval(id)
  }, [chasing])

  const on = chasing && ready
  useEffect(() => {
    if (!on) return
    document.documentElement.classList.add('gta-chase')
    signal('siren', 4)
    return () => document.documentElement.classList.remove('gta-chase')
  }, [on])

  const calm = () => {
    setLater(true)
    try {
      sessionStorage.setItem(LATER, '1')
    } catch {
      // Without storage it only lasts until the page reloads.
    }
  }

  // Closing a game opened from ?chase drops it from the URL, so a reload shows the normal homepage.
  const closeGame = () => {
    setGame(false)
    if (!direct()) return
    const url = new URL(window.location.href)
    url.searchParams.delete('chase')
    window.history.replaceState(null, '', url)
  }

  const won = useCallback(() => {
    writeGta({ heat: raw })
    completeQuest('heat')
    banner({ kicker: T.kicker, title: T.won, line: T.wonLine, tone: 'pass' })
  }, [raw, T])

  return (
    <>
      {on && !game && createPortal(
        <div className="gta-chase-bar" role="status">
          <span className="gta-chase-lights" aria-hidden="true"><i /><i /></span>
          <span><small>{T.kicker}</small><strong>{T.line}</strong></span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setGame(true)}>🚗 {T.go}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={calm}>{T.later}</button>
        </div>,
        document.body,
      )}
      {game && <LoseTheHeat onClose={closeGame} onWin={won} />}
    </>
  )
}

const LANES = 3
const ROWS = 7
const LENGTH = 20 // seconds to survive

// A three-lane road seen from above: patrol cars come down, you switch lanes. It moves in steps (one row per tick),
// so reduced motion only slows it down and drops the sliding.
function LoseTheHeat({ onClose, onWin }) {
  const T = useGtaText().chase
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [phase, setPhase] = useState('intro') // intro → run → busted | won
  const [lane, setLane] = useState(1)
  const [cops, setCops] = useState([])
  const [left, setLeft] = useState(LENGTH)
  const laneRef = useRef(1)
  const copsRef = useRef([])
  const started = useRef(0)
  const box = useRef(null)
  const winRef = useRef(onWin)
  winRef.current = onWin

  const crash = (l, list) => list.some((c) => c.row === ROWS - 1 && c.lane === l)

  const move = useCallback((step) => {
    if (phase !== 'run') return
    const next = Math.max(0, Math.min(LANES - 1, laneRef.current + step))
    if (next === laneRef.current) return
    laneRef.current = next
    setLane(next)
    beep('tick')
    if (crash(next, copsRef.current)) setPhase('busted')
  }, [phase])

  useEffect(() => {
    box.current?.querySelector('button')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose()
      const step = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }[e.key]
      if (step) {
        e.preventDefault()
        move(step)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [move, onClose])

  useEffect(() => {
    if (phase !== 'run') return
    let id = 0
    let rows = 0
    const tick = () => {
      const elapsed = (performance.now() - started.current) / 1000
      const remain = Math.max(0, LENGTH - elapsed)
      setLeft(remain)
      if (remain === 0) {
        setPhase('won')
        return
      }
      // Cars move down a row; a new row comes in at the top with at most two cars, never on every lane.
      let list = copsRef.current.map((c) => ({ ...c, row: c.row + 1 })).filter((c) => c.row < ROWS)
      rows++
      if (rows % 2 === 0) {
        const count = Math.random() < 0.25 + elapsed / 60 ? 2 : 1
        const open = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count)
        list = [...list, ...open.map((l) => ({ id: `${rows}-${l}`, lane: l, row: 0 }))]
      }
      copsRef.current = list
      setCops(list)
      if (crash(laneRef.current, list)) {
        setPhase('busted')
        return
      }
      const speed = reduced ? 420 : Math.max(150, 280 - elapsed * 6)
      id = setTimeout(tick, speed)
    }
    id = setTimeout(tick, 400)
    return () => clearTimeout(id)
  }, [phase, reduced])

  useEffect(() => {
    if (phase === 'busted') {
      beep('lose')
      haptic([60, 40, 60])
    }
    if (phase === 'won') {
      beep('win')
      winRef.current()
    }
  }, [phase])

  const start = () => {
    laneRef.current = 1
    copsRef.current = []
    setLane(1)
    setCops([])
    setLeft(LENGTH)
    started.current = performance.now()
    setPhase('run')
    signal('siren', LENGTH)
  }

  return createPortal(
    <div className="gta-modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gta-modal gta-heat" role="dialog" aria-modal="true" aria-labelledby="gta-heat-title" ref={box}>
        <button type="button" className="gta-modal-close" onClick={onClose} aria-label={T.close}>×</button>
        <p className="gta-label">{T.kicker}</p>
        <h2 id="gta-heat-title">{T.title}</h2>
        <div className="gta-heat-hud">
          <span>{T.time} <b>{Math.ceil(left)}s</b></span>
          <span className="gta-heat-stars" aria-hidden="true">{phase === 'won' ? '☆☆☆☆☆' : '★★★★★'}</span>
        </div>
        <div className={`gta-road${reduced ? ' still' : ''}${phase === 'run' ? ' run' : ''}`} role="img" aria-label={T.road}>
          <i className="gta-road-lines" aria-hidden="true" />
          {cops.map((c) => (
            <span key={c.id} className="gta-car cop" style={{ '--l': c.lane, '--r': c.row }} aria-hidden="true">🚓</span>
          ))}
          <span className={`gta-car you${phase === 'busted' ? ' hit' : ''}`} style={{ '--l': lane, '--r': ROWS - 1 }} aria-hidden="true">🚘</span>
          {phase !== 'run' && (
            <div className="gta-road-msg">
              {phase === 'intro' && <><p>{T.intro}</p><button type="button" className="btn btn-primary btn-sm" onClick={start}>▶ {T.start}</button></>}
              {phase === 'busted' && <><strong className="bad">{T.busted}</strong><p>{T.bustedLine}</p><button type="button" className="btn btn-primary btn-sm" onClick={start}>↺ {T.retry}</button></>}
              {phase === 'won' && <><strong className="good">{T.won}</strong><p>{T.wonLine}</p><button type="button" className="btn btn-primary btn-sm" onClick={onClose}>{T.close}</button></>}
            </div>
          )}
        </div>
        <div className="gta-heat-pad">
          <button type="button" className="btn btn-ghost" onClick={() => move(-1)} disabled={phase !== 'run'}>◀ {T.left}</button>
          <button type="button" className="btn btn-ghost" onClick={() => move(1)} disabled={phase !== 'run'}>{T.right} ▶</button>
        </div>
        <p className="sr-only" aria-live="assertive">{phase === 'busted' ? T.busted : phase === 'won' ? T.won : ''}</p>
      </div>
    </div>,
    document.body,
  )
}
