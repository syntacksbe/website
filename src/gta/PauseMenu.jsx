import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ACHIEVEMENTS, useGame, useWanted } from '../game.jsx'
import { beep, setSound, soundOn } from '../arcade/fx.js'
import { useEconomy } from './economy.js'
import { personaById } from './personas.js'
import { QUESTS, cheat, completeQuest } from './quests.js'
import { addTo, onSignal, readGta, resetGta, typing, useGtaState } from './store.js'
import { useGtaText } from './text.js'

// The pause menu (M or P, or the map button on the radar and in the phone menu): a map of the site to fast-travel,
// stats, the 100% checklist and settings. Shared by the homepage and the Arcade (`page`).
// The shop and the profile are pages of the Arcade (src/arcade/Shop.jsx, Profile.jsx), not part of this menu.
const TABS = ['map', 'stats', 'checklist', 'settings']

// The site as a city. x/y are in the map's 640×420 frame; `color` tints the district block.
export const DISTRICTS = [
  { id: 'top', icon: '✈️', x: 118, y: 344, w: 150, h: 52, color: '#5b6472' },
  { id: 'services', icon: '🏙️', x: 318, y: 196, w: 120, h: 86, color: '#ff7a33' },
  { id: 'certifications', icon: '🏆', x: 176, y: 164, w: 104, h: 70, color: '#ffb21a' },
  { id: 'approach', icon: '🗺️', x: 470, y: 150, w: 104, h: 70, color: '#e5484d' },
  { id: 'experience', icon: '🗂️', x: 438, y: 270, w: 104, h: 64, color: '#8b7d6b' },
  { id: 'health-check', icon: '🩺', x: 246, y: 292, w: 98, h: 60, color: '#1fb5ad' },
  { id: 'contact', icon: '💬', x: 548, y: 322, w: 92, h: 60, color: '#22c55e' },
  { id: 'arcade', icon: '🎰', x: 384, y: 70, w: 120, h: 58, color: '#c026d3' },
]
const ROADS = 'M118 344 L246 292 L318 196 L176 164 M318 196 L470 150 M318 196 L438 270 L548 322 M318 196 L384 70 M246 292 L438 270'

const SECTION_IDS = ['services', 'certifications', 'approach', 'experience', 'health-check', 'contact']

function whereAmI(page) {
  if (page === 'arcade') return 'arcade'
  const mid = window.scrollY + window.innerHeight / 2
  let here = 'top'
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id)
    if (el && el.offsetTop <= mid) here = id
  }
  return here
}

function travel(page, id, label) {
  addTo('travels', id)
  if (readGta().travels.length >= 4) completeQuest('tourist')
  if (id === 'arcade') {
    window.location.href = page === 'arcade' ? '#/' : 'arcade/'
    return
  }
  if (page === 'arcade') {
    window.location.href = id === 'top' ? '../' : `../#${id}`
    return
  }
  const go = () => (id === 'top' ? window.scrollTo({ top: 0, behavior: 'instant' }) : document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }))
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
  const warp = document.createElement('div')
  warp.className = 'fast-travel'
  warp.setAttribute('aria-hidden', 'true')
  warp.innerHTML = '<span></span>'
  warp.firstChild.textContent = label
  document.body.appendChild(warp)
  setTimeout(go, 280)
  setTimeout(() => warp.remove(), 720)
}

function MapTab({ page, onClose }) {
  const T = useGtaText().map
  const Q = useGtaText().quests
  const state = useGtaState()
  const here = useRef(whereAmI(page)).current
  const open = QUESTS.filter((q) => !state.quests.includes(q.id))
  const go = (d) => {
    onClose()
    travel(page, d.id, T.travel)
  }
  const pos = (x, y) => ({ left: `${(x / 640) * 100}%`, top: `${(y / 420) * 100}%` })
  const spotOf = (q) => DISTRICTS.find((d) => d.id === q.spot)

  return (
    <div className="gta-map-tab">
      <div className="gta-map" role="group" aria-label={T.aria}>
        <svg viewBox="0 0 640 420" aria-hidden="true">
          <rect width="640" height="420" className="gm-sea" />
          <path className="gm-land" d="M40 300 C30 220 80 150 150 120 C190 60 300 30 400 34 C500 38 590 80 610 170 C630 260 610 350 560 380 C470 410 300 412 180 400 C100 392 50 360 40 300Z" />
          <path className="gm-hills" d="M330 40 C380 30 460 40 520 70 C470 90 400 100 330 96Z" />
          <path className="gm-road" d={ROADS} />
          <path className="gm-road-line" d={ROADS} />
          {DISTRICTS.map((d) => (
            <rect key={d.id} className="gm-block" x={d.x - d.w / 2} y={d.y - d.h / 2} width={d.w} height={d.h} rx="10" style={{ '--c': d.color }} />
          ))}
        </svg>
        {DISTRICTS.map((d) => (
          <button type="button" key={d.id} className={`gm-blip${d.id === here ? ' here' : ''}`} style={{ ...pos(d.x, d.y), '--c': d.color }}
            onClick={() => go(d)} aria-label={`${T.travel}: ${T.districts[d.id][0]}`}>
            <span aria-hidden="true">{d.icon}</span>
            <small>{T.districts[d.id][0]}</small>
            {d.id === here && <em>{T.here}</em>}
          </button>
        ))}
        {open.map((q) => {
          const d = spotOf(q)
          return (
            <span key={q.id} className="gm-quest" style={pos(d.x + d.w / 2 - 6, d.y - d.h / 2 + 4)} title={Q[q.id][1]} aria-hidden="true">?</span>
          )
        })}
      </div>
      <div className="gta-map-legend">
        <p className="gta-label">{T.legend}</p>
        <ul>
          {DISTRICTS.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => go(d)} style={{ '--c': d.color }}>
                <span aria-hidden="true">{d.icon}</span>
                <strong>{T.districts[d.id][0]}</strong>
                <small>{T.districts[d.id][1]}</small>
              </button>
            </li>
          ))}
        </ul>
        <p className="gta-label">{T.quests} · {QUESTS.length - open.length}/{QUESTS.length}</p>
        <ul className="gta-quests">
          {QUESTS.map((q) => {
            const done = state.quests.includes(q.id)
            return (
              <li key={q.id} className={done ? 'done' : ''}>
                <b aria-hidden="true">{done ? '✓' : '?'}</b>
                <strong>{Q[q.id][0]}</strong>
                <small>{done ? T.done : Q[q.id][1]}</small>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function Bar({ value }) {
  return <span className="gta-bar" aria-hidden="true"><i style={{ '--v': Math.max(0, Math.min(1, value)) }} /></span>
}

function StatsTab({ page }) {
  const T = useGtaText().stats
  const P = useGtaText().personas
  const eco = useEconomy()
  const w = useWanted()
  const { done } = useGame()
  const badges = ACHIEVEMENTS.filter((a) => done.has(a.id)).length
  const rows = [
    [T.badges, `${badges}/${ACHIEVEMENTS.length}`],
    [T.arcadeStars, w.arcadeStars],
    [T.quests, `${eco.state.quests.length}/${QUESTS.length}`],
    [T.wanted, `${'★'.repeat(w.stars)}${'☆'.repeat(5 - w.stars)}`],
    [T.health, w.healthCheck ? T.yes : T.no],
    [T.playing, P[personaById(eco.state.persona).id][0]],
  ]
  return (
    <div className="gta-stats-tab">
      <div className="gta-rank-card">
        <span className="gta-rank-badge"><b>{eco.rank}</b></span>
        <div>
          <p className="gta-label">{T.rank} {eco.rank} · {eco.level.name}</p>
          <Bar value={(eco.rp - eco.from) / (eco.to - eco.from)} />
          <small>{eco.rp} {T.rp} · {T.toNext(eco.rank + 1, eco.to - eco.rp)}</small>
        </div>
      </div>
      <dl className="gta-rows">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <p className="gta-note">{T.how}</p>
    </div>
  )
}

const ARCADE_KEY = 'syntacks-arcade-catalog-v1'

function ChecklistTab({ page }) {
  const T = useGtaText().checklist
  const { done } = useGame()
  const w = useWanted()
  const state = useGtaState()
  const [games, setGames] = useState(null)

  useEffect(() => {
    let live = true
    import('../arcade/catalog.js').then(({ GAMES }) => live && setGames(GAMES)).catch(() => live && setGames([]))
    return () => { live = false }
  }, [])

  let best = {}
  try {
    best = JSON.parse(localStorage.getItem(ARCADE_KEY) || '{}') || {}
  } catch {
    // No Arcade progress.
  }
  const rows = [
    ['badges', ACHIEVEMENTS.filter((a) => done.has(a.id)).length, ACHIEVEMENTS.length],
    ...(games?.length ? [
      ['arcadeGames', games.filter((g) => best[g.id] > 0).length, games.length],
      ['arcadeStars', Math.min(w.arcadeStars, games.length * 3), games.length * 3],
    ] : []),
    ['quests', state.quests.length, QUESTS.length],
    ['health', w.healthCheck ? 1 : 0, 1],
    ['crew', state.crew ? 1 : 0, 1],
  ]
  const total = rows.reduce((sum, [, n, of]) => sum + Math.min(1, n / of), 0) / rows.length
  const pct = Math.floor(total * 1000) / 10

  return (
    <div className="gta-check-tab">
      <p className="gta-check-total"><strong>{pct.toFixed(1)}%</strong> <span>{T.title}</span></p>
      <Bar value={total} />
      {!games && <p className="gta-note">{T.loading}</p>}
      <ul className="gta-check">
        {rows.map(([id, n, of]) => (
          <li key={id} className={n >= of ? 'done' : ''}>
            <b aria-hidden="true">{n >= of ? '✓' : ''}</b>
            <span>{T.rows[id]}</span>
            <Bar value={n / of} />
            <em>{n}/{of}</em>
          </li>
        ))}
      </ul>
      {pct >= 100 && <p className="gta-check-done">🏆 {T.complete}</p>}
    </div>
  )
}

function SettingsTab({ page }) {
  const T = useGtaText().settings
  const [sound, setSoundState] = useState(soundOn)
  const [code, setCode] = useState('')
  const [said, setSaid] = useState('')
  const [sure, setSure] = useState(false)
  return (
    <div className="gta-settings-tab">
      <div className="gta-setting">
        <span><strong>{T.sound}</strong><small>{T.soundNote}</small></span>
        <button type="button" role="switch" aria-checked={sound} className="gta-switch" onClick={() => { setSound(!sound); setSoundState(!sound) }}>
          {sound ? T.on : T.off}
        </button>
      </div>
      <a className="gta-profile-link" href={page === 'arcade' ? '#/profile' : 'arcade/#/profile'}>👤 {T.profile}</a>
      <p className="gta-label">{T.keys}</p>
      <dl className="gta-keys">
        {T.keyList.map(([k, v]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>)}
      </dl>
      <p className="gta-label">{T.cheat}</p>
      <form className="gta-cheat" onSubmit={(e) => {
        e.preventDefault()
        setSaid(cheat(code) ? T.cheatOk : T.cheatBad)
        setCode('')
      }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.cheatPh} aria-label={T.cheat} autoComplete="off" spellCheck="false" maxLength={40} />
        <button type="submit" className="btn btn-ghost btn-sm">{T.cheatGo}</button>
        <span aria-live="polite">{said}</span>
      </form>
      {page !== 'arcade' && <div className="gta-reset">
        {sure ? (
          <>
            <p>{T.resetSure}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { resetGta(); setSure(false) }}>{T.resetYes}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSure(false)}>{T.resetNo}</button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSure(true)}>{T.reset}</button>
        )}
      </div>}
    </div>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', weekday: 'short' }).format(now)
}

function Menu({ page, tab, setTab, onClose }) {
  const T = useGtaText()
  const eco = useEconomy()
  const box = useRef(null)
  const persona = personaById(eco.state.persona)

  useEffect(() => {
    const before = document.activeElement
    box.current?.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (typing(e)) return
      const move = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
      if (move && e.target.closest?.('[role="tablist"]')) {
        e.preventDefault()
        const next = TABS[(TABS.indexOf(tab) + move + TABS.length) % TABS.length]
        setTab(next)
        box.current.querySelector(`#gta-tab-${next}`)?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('gta-paused')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('gta-paused')
      before?.focus?.({ preventScroll: true })
    }
  }, [onClose, setTab, tab, page])

  return createPortal(
    <div className="gta-pause" role="dialog" aria-modal="true" aria-labelledby="gta-pause-title" ref={box}>
      <header className="gta-pause-head">
        <div>
          <small id="gta-pause-title">{T.pause.title}</small>
          <strong>{page === 'home' ? T.personas[persona.id][0] : 'Syntacks Arcade'}</strong>
        </div>
        <div className="gta-pause-hud">
          <span><small>{T.pause.brussels}</small> <Clock /></span>
              <span className="gta-rank-badge small" title={`${T.pause.rank} ${eco.rank}`}><b>{eco.rank}</b></span>
        </div>
      </header>
      <div className="gta-tabs" role="tablist" aria-label={T.pause.title}>
        {TABS.map((id) => (
          <button type="button" role="tab" key={id} id={`gta-tab-${id}`} aria-selected={tab === id} aria-controls="gta-pane" tabIndex={tab === id ? 0 : -1}
            onClick={() => { setTab(id); beep('tick') }}>
            {T.pause.tabs[id]}
          </button>
        ))}
      </div>
      <div className="gta-pane" role="tabpanel" id="gta-pane" aria-labelledby={`gta-tab-${tab}`} key={tab}>
        {tab === 'map' && <MapTab page={page} onClose={onClose} />}
        {tab === 'stats' && <StatsTab page={page} />}
        {tab === 'checklist' && <ChecklistTab page={page} />}
        {tab === 'settings' && <SettingsTab page={page} />}
      </div>
      <footer className="gta-pause-foot">
        <span>{T.pause.keys}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>▶ {T.pause.resume}</button>
      </footer>
    </div>,
    document.body,
  )
}

export default function PauseMenu({ page }) {
  const [tab, setTab] = useState(null)

  useEffect(() => onSignal('pause', (t) => {
    setTab(TABS.includes(t) ? t : 'map')
    beep('hit')
  }), [page])

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || typing(e)) return
      const k = e.key.toLowerCase()
      if (k !== 'm' && k !== 'p') return
      if (document.querySelector('.gta-modal, .gta-wheel-wrap')) return
      e.preventDefault()
      setTab((t) => (t ? null : 'map'))
      beep('hit')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!tab) return null
  return <Menu page={page} tab={tab} setTab={setTab} onClose={() => setTab(null)} />
}
