import { useEffect, useRef, useState } from 'react'
import { useMedia } from '../useMedia.js'
import { useLang } from '../i18n.jsx'
import { QUESTS } from '../gta/quests.js'
import { signal, useGtaState } from '../gta/store.js'
import { useGtaText } from '../gta/text.js'

// Sections on the radar. `x` spreads the blips left and right of the main road;
// `icon` marks the big blips, the rest show as small dots. Their names are map.spots in strings.<lang>.js.
const SPOTS = [
  { id: 'top', x: 24, icon: '🏠' },
  { id: 'services', x: -30 },
  { id: 'certifications', x: -24, icon: '🏆' },
  { id: 'approach', x: 30 },
  { id: 'experience', x: -32 },
  { id: 'health-check', x: 28 },
  { id: 'contact', x: -18, icon: '💬' },
]

const R = 66 // radar radius in px
const EDGE = R - 10 // blips further out are pinned to the rim, like a GPS waypoint

function measure() {
  return SPOTS.map((s) => {
    const el = document.getElementById(s.id)
    if (!el) return null
    // The nav (Home) is sticky, so its offsetTop follows the scroll; Home is always the top of the page.
    const top = s.id === 'top' ? 0 : el.offsetTop
    return { ...s, top, bottom: top + el.offsetHeight }
  }).filter(Boolean)
}

// Map coordinates of a page position relative to the player, clamped to the rim.
function onRadar(x, dy) {
  const dist = Math.hypot(x, dy)
  if (dist <= EDGE) return { x, y: dy, far: false }
  return { x: (x / dist) * EDGE, y: (dy / dist) * EDGE, far: true }
}

export default function MiniMap() {
  const { t } = useLang()
  const names = t('map.spots')
  const hidden = useMedia('(max-width: 760px)')
  const [spots, setSpots] = useState([])
  const [view, setView] = useState({ y: 0, h: 800, down: true })
  const [warping, setWarping] = useState(false)
  const [aim, setAim] = useState(null) // the blip under the pointer or keyboard focus: its name shows on the map
  const lastY = useRef(0)
  // Side quests not done yet show as "?" blips at their section (see src/gta/quests.js).
  const { quests: questsDone } = useGtaState()
  const G = useGtaText()
  const openQuests = QUESTS.filter((q) => !questsDone.includes(q.id))

  useEffect(() => {
    if (hidden) return
    const remeasure = () => setSpots(measure())
    remeasure()
    // Section heights change as demos open and fonts load, so re-measure now and then.
    const id = setInterval(remeasure, 2000)
    window.addEventListener('resize', remeasure)

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        setView((v) => ({ y, h: window.innerHeight, down: y === lastY.current ? v.down : y > lastY.current }))
        lastY.current = y
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearInterval(id)
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', onScroll)
    }
  }, [hidden])

  if (hidden || !spots.length) return null
  const label = (s) => names[s.id]

  // The whole page is about 2.4 radar radii tall: mid-page every blip is on the map,
  // near the ends the far ones are pinned to the rim.
  const scale = (EDGE * 2.4) / document.documentElement.scrollHeight
  const centre = view.y + view.h / 2
  const here = [...spots].reverse().find((s) => centre >= s.top) || null
  const visible = view.y > view.h * 0.6

  const fastTravel = (spot) => {
    const el = document.getElementById(spot.id)
    if (!el) return
    // The nav is sticky, so "Home" scrolls the window to the very top instead.
    const go = () => (spot.id === 'top' ? window.scrollTo({ top: 0, behavior: 'instant' }) : el.scrollIntoView({ behavior: 'instant' }))
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      go()
      return
    }
    setWarping(true)
    setTimeout(go, 280)
    setTimeout(() => setWarping(false), 700)
  }

  return (
    <>
      <aside className={`minimap${visible ? ' on' : ''}`} aria-label={t('map.aria')}>
        <div className="minimap-radar">
          <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} aria-hidden="true">
            <defs>
              <clipPath id="radar-clip"><circle r={R - 2} /></clipPath>
            </defs>
            <g clipPath="url(#radar-clip)">
              <circle r={R} className="mm-ground" />
              <g transform={`translate(0 ${-centre * scale})`}>
                {/* the main road runs down the whole page; side streets lead to each section */}
                <path className="mm-road" d={`M0 0V${document.documentElement.scrollHeight * scale}`} />
                {spots.map((s) => (
                  <path key={s.id} className="mm-street" d={`M0 ${s.top * scale}H${s.x}`} />
                ))}
                {spots.map((s) => (
                  <rect key={`${s.id}-b`} className="mm-block" x={s.x > 0 ? 8 : -46} y={s.top * scale + 6} width="38" height={Math.max(10, (s.bottom - s.top) * scale - 12)} rx="3" />
                ))}
              </g>
              <circle r={R * 0.33} className="mm-ring" />
              <circle r={R * 0.66} className="mm-ring" />
              <g className="mm-sweep"><path d={`M0 0L0 ${-R}A${R} ${R} 0 0 1 ${R * 0.7} ${-R * 0.71}Z`} /></g>
            </g>
            <circle r={R - 1} className="mm-rim" />
            <text y={-R + 13} className="mm-north">N</text>
            <path className="mm-player" d="M0 -7L6 6L0 3L-6 6Z" transform={view.down ? 'rotate(180)' : undefined} />
          </svg>
          {spots.map((s) => {
            const p = onRadar(s.x, (s.top - centre) * scale)
            const show = () => setAim(s.id)
            const hide = () => setAim((a) => (a === s.id ? null : a))
            return (
              <button
                key={s.id}
                type="button"
                className={`mm-blip${s.icon ? ' big' : ''}${p.far ? ' far' : ''}${here?.id === s.id ? ' here' : ''}`}
                style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                onClick={() => fastTravel(s)}
                onPointerEnter={show}
                onPointerLeave={hide}
                onFocus={show}
                onBlur={hide}
                aria-label={t('map.fastTravelTo', label(s))}
              >
                {s.icon || ''}
              </button>
            )
          })}
          {openQuests.map((q) => {
            const s = spots.find((x) => x.id === q.spot)
            if (!s) return null
            const p = onRadar(q.x, (s.top + 40 - centre) * scale)
            return (
              <span key={q.id} className={`mm-blip mm-quest${p.far ? ' far' : ''}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }} title={`${G.quests[q.id][0]}: ${G.quests[q.id][1]}`} aria-hidden="true">?</span>
            )
          })}
          {spots.filter((s) => s.id === aim).map((s) => {
            const p = onRadar(s.x, (s.top - centre) * scale)
            return (
              <span key={s.id} className="mm-tag" style={{ transform: `translate(${p.x}px, ${p.y}px)` }} aria-hidden="true">
                {label(s)}
              </span>
            )
          })}
        </div>
        <p className="minimap-label">{aim ? t('map.goTo', names[aim]) : `📍 ${here ? label(here) : t('map.downtown')}`}</p>
        <button type="button" className="minimap-map" onClick={() => signal('pause', 'map')} title={G.pause.keys}>🗺️ {G.pause.tabs.map} <kbd>M</kbd></button>
      </aside>
      {warping && <div className="fast-travel" aria-hidden="true"><span>{t('map.fastTravel')}</span></div>}
    </>
  )
}
