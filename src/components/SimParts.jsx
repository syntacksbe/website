import { useEffect, useRef, useState } from 'react'
import { wasted } from '../gta/screens.js'

// Building blocks shared by the simulation demos (Service desk, Sales pipeline): the switches,
// the run loop, the HUD with its timeline and the results screen.

// Runs a simulation: `create(setup)` returns an engine with tick(dt), done, summary() and a
// `setup` that can be swapped while it runs. `step` is game time per 100 ms at 1×.
export function useSim({ toggles, create, step, onDone }) {
  const [phase, setPhase] = useState('setup') // setup → run → done
  const [setup, setSetup] = useState(() => Object.fromEntries(toggles.map((x) => [x.id, false])))
  const [speed, setSpeed] = useState(1)
  const [switches, setSwitches] = useState([]) // flips during the run, marked on the timeline
  const [result, setResult] = useState(null)
  const [, setFrame] = useState(0)
  const sim = useRef(null)
  const setupRef = useRef(setup)
  const speedRef = useRef(1)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (phase !== 'run') return
    const id = setInterval(() => {
      const s = sim.current
      s.tick(step * speedRef.current)
      setFrame((f) => f + 1)
      if (!s.done) return
      const r = s.summary()
      setResult(r)
      setPhase('done')
      done.current?.(r, s)
    }, 100)
    return () => clearInterval(id)
  }, [phase, step])

  function start() {
    sim.current = create(setupRef.current)
    setSwitches([])
    setResult(null)
    setPhase('run')
  }

  // Flips a switch; during the run the engine picks it up on its next tick.
  function flip(id) {
    const next = { ...setupRef.current, [id]: !setupRef.current[id] }
    setupRef.current = next
    setSetup(next)
    if (phase === 'run' && sim.current) {
      sim.current.setup = next
      setSwitches((list) => [...list, { t: sim.current.t, id, on: next[id] }])
    }
  }

  function toggleSpeed() {
    speedRef.current = speedRef.current === 1 ? 2 : 1
    setSpeed(speedRef.current)
  }

  return {
    phase, setup, speed, switches, result, sim: sim.current,
    start, flip, toggleSpeed,
    toSetup: () => setPhase('setup'),
    refresh: () => setFrame((f) => f + 1),
  }
}

export function SetupCards({ toggles, setup, onFlip }) {
  return (
    <div className="sim-toggles">
      {toggles.map((x) => (
        <button type="button" role="switch" aria-checked={setup[x.id]} key={x.id} className="sim-toggle" onClick={() => onFlip(x.id)}>
          <span className="sim-toggle-head">
            <span aria-hidden="true">{x.icon}</span>
            <em>{setup[x.id] ? 'On' : 'Off'}</em>
          </span>
          <strong>{x.name}</strong>
          <small className="sim-feature">{x.feature}</small>
          <small>{setup[x.id] ? x.on : x.off}</small>
        </button>
      ))}
    </div>
  )
}

// The same switches, small enough to flip mid-game.
export function LiveSwitches({ toggles, setup, onFlip }) {
  return (
    <div className="sim-live" role="group" aria-label="Change the setup live">
      {toggles.map((x) => (
        <button
          type="button" role="switch" aria-checked={setup[x.id]} key={x.id} className="sim-live-switch"
          onClick={() => onFlip(x.id)} title={setup[x.id] ? x.on : x.off}
        >
          <span aria-hidden="true">{x.icon}</span>
          {x.name}
          <i aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function Hud({ clock, t, total, switches, toggles, speed, onSpeed, children }) {
  return (
    <div className="sim-hud">
      <span className="sim-clock">{clock}</span>
      <span className="sim-progress" aria-hidden="true">
        <i style={{ width: `${(t / total) * 100}%` }} />
        {switches.map((s, i) => (
          <b key={i} className={s.on ? 'on' : ''} style={{ left: `${(s.t / total) * 100}%` }}>
            {toggles.find((x) => x.id === s.id)?.icon}
          </b>
        ))}
      </span>
      {children}
      {onSpeed && (
        <button type="button" className="sim-speed" aria-pressed={speed === 2} onClick={onSpeed} aria-label="Fast forward">
          ⏩ {speed}×
        </button>
      )}
    </div>
  )
}

export function Results({ stamp, caption, metrics, tip, switches, onTweak, onReplay }) {
  // A failed run gets the "Wasted" screen once, when the results appear.
  const bad = stamp.tone === 'bad'
  useEffect(() => {
    if (bad) wasted(caption)
  }, [bad, caption])
  return (
    <div className="sim-results">
      <span className={`hc-stamp ${stamp.tone}`}>{stamp.label}</span>
      <p className="sim-label">{caption}</p>
      <div className="sim-metrics">
        {metrics.map((m) => (
          <div className={`sim-metric${m.better ? ' better' : ''}`} key={m.label}>
            <small>{m.label}</small>
            <strong>{m.mine}</strong>
            <span>vs {m.theirs}</span>
          </div>
        ))}
      </div>
      <p className="sim-tip">💡 {tip}</p>
      {switches > 0 && <p className="sim-note">You flipped {switches} switch{switches > 1 ? 'es' : ''} mid-game: the markers on the timeline show where.</p>}
      <div className="sim-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onTweak}>⚙ Tweak the setup</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onReplay}>↺ Run it again</button>
      </div>
    </div>
  )
}

// The first switch left off, for the results tip.
export const firstOff = (toggles, setup) => toggles.find((x) => !setup[x.id])
