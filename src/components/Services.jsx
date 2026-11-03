import { useEffect, useRef, useState } from 'react'
import { useContent, useLang } from '../i18n.jsx'
import SectionHead from './SectionHead.jsx'
import { FINAL, LOOP, SCENES } from './ServiceScenes.jsx'
import { useMedia } from '../useMedia.js'
import PersonaBar from '../gta/PersonaBar.jsx'
import { personaById } from '../gta/personas.js'
import { onSignal, useGtaState } from '../gta/store.js'

// Services as a loadout screen: pick a specialist on the left, its scene loops on the screen.
// Left alone, it moves to the next specialist after each loop, like an attract mode. The clock only
// ticks while the section is on screen, and stands still on the last frame with reduced motion.
const TICK = 100
const TICKS = LOOP * (1000 / TICK)

export default function Services() {
  const { t: tr } = useLang()
  const { services } = useContent()
  const [active, setActive] = useState(0)
  const [tick, setTick] = useState(0)
  const [loop, setLoop] = useState(0) // remounts the scene so it starts clean
  const [idle, setIdle] = useState(true)
  const [hover, setHover] = useState(false)
  const [punch, setPunch] = useState(false)
  const [visible, setVisible] = useState(false)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  // Stacked (phones, tablets), the text sits under the screen: moving on by itself would swap it while you read.
  const stacked = useMedia('(max-width: 1024px)')
  const root = useRef(null)
  const row = useRef(null)
  const s = services[active]
  const Scene = SCENES[s.id]
  const t = reduced ? FINAL : tick / (1000 / TICK)
  const auto = idle && !hover && !reduced && !stacked
  // The character from the character wheel: its services are lit, the others dimmed, and the section takes its colour.
  const persona = personaById(useGtaState().persona)
  const lit = persona.services

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !visible) return
    const id = setInterval(() => setTick((n) => n + 1), TICK)
    return () => clearInterval(id)
  }, [reduced, visible])

  useEffect(() => {
    if (tick < TICKS) return
    if (auto) setActive((a) => (a + 1) % services.length)
    setPunch(false)
    setLoop((l) => l + 1)
    setTick(0)
  }, [tick, auto, services.length])

  // On phones the tiles are a swipeable row: keep the chosen one in view without moving the page.
  useEffect(() => {
    const r = row.current
    const tile = r?.children[active]
    if (!tile || r.scrollWidth <= r.clientWidth) return
    r.scrollTo({ left: tile.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' })
  }, [active, reduced])

  const pick = (i) => {
    setActive(i)
    setTick(0)
    setLoop((l) => l + 1)
    setIdle(false)
    setPunch(true)
  }

  // Switching character jumps to its first speciality.
  const shown = useRef(persona.id)
  useEffect(() => {
    if (shown.current === persona.id) return
    shown.current = persona.id
    const i = services.findIndex((sv) => sv.id === lit[0])
    if (i >= 0) pick(i)
  }, [persona.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // The tool wheel opens a service from anywhere on the page.
  useEffect(() => onSignal('service', (id) => {
    const i = services.findIndex((sv) => sv.id === id)
    if (i < 0) return
    pick(i)
    root.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' })
  }), [services, reduced])

  const onKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (active + step + services.length) % services.length
    pick(next)
    row.current.children[next].focus()
  }

  return (
    <section className="section" id="services" data-persona={persona.id}>
      <div className="container">
        <SectionHead kicker={tr('services.kicker')} title={tr('services.title')}>
          {tr('services.sub')}
        </SectionHead>

        <PersonaBar />

        <div className="ld reveal" ref={root} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <div className="ld-tiles" role="tablist" aria-label={tr('services.tabs')} aria-orientation="vertical" ref={row} onKeyDown={onKey}>
            {services.map((sv, i) => (
              <button
                type="button"
                role="tab"
                key={sv.id}
                id={`ld-tab-${sv.id}`}
                aria-selected={i === active}
                aria-controls="ld-panel"
                tabIndex={i === active ? 0 : -1}
                className={`ld-tile${lit.includes(sv.id) ? ' lit' : ' dim'}`}
                onClick={() => pick(i)}
              >
                <span className="ld-tile-n">{String(i + 1).padStart(2, '0')}</span>
                <strong>{sv.title}</strong>
                <small>{sv.tag}</small>
                {i === active && auto && <i className="ld-timer" style={{ width: `${(tick / TICKS) * 100}%` }} />}
              </button>
            ))}
          </div>

          <div className="ld-screen" aria-hidden="true">
            <div className="ld-hud">
              <span>{String(active + 1).padStart(2, '0')} · {s.scene}</span>
              <span className="ld-live">{tr('services.live')}</span>
            </div>
            <div className={`ld-scene${punch ? ' punch' : ''}${t >= LOOP - 0.3 ? ' out' : ''}`} key={`${s.id}-${loop}`}>
              <Scene t={t} />
            </div>
          </div>

          <div className="ld-info" role="tabpanel" id="ld-panel" aria-labelledby={`ld-tab-${s.id}`} key={s.id}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <div className="ld-gear">
              <span className="ld-label">{tr('services.loadout')}</span>
              <ul>{s.gear.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
            <p className="ld-special"><span className="ld-label">{tr('services.special')}</span> {s.special}</p>
            <a className="btn btn-primary" href={s.cta.href}>
              ▶ {s.cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
