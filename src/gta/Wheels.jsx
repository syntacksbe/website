import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { beep } from '../arcade/fx.js'
import { PERSONAS, TOOLS } from './personas.js'
import { onSignal, signal, typing, writeGta, readGta } from './store.js'
import { useGtaText } from './text.js'

// A radial wheel, like GTA's weapon and character wheels. The item under the pointer (by angle from the centre),
// the arrow keys or a number key highlight one; a click, Enter, or releasing the held key picks it.
function Wheel({ title, items, current, center, onPick, onClose, hint, closeLabel }) {
  const [aim, setAim] = useState(() => Math.max(0, items.findIndex((i) => i.id === current)))
  const ring = useRef(null)
  const n = items.length
  const angleOf = (i) => (i / n) * Math.PI * 2 - Math.PI / 2
  const aimRef = useRef(aim)
  aimRef.current = aim

  useEffect(() => {
    ring.current?.querySelectorAll('.gta-wheel-item')[aimRef.current]?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose()
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      if (move) {
        e.preventDefault()
        const next = (aimRef.current + move + n) % n
        setAim(next)
        ring.current?.querySelectorAll('.gta-wheel-item')[next]?.focus({ preventScroll: true })
        beep('tick')
      }
      const digit = Number(e.key)
      if (digit >= 1 && digit <= n) onPick(items[digit - 1])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [items, n, onClose, onPick])

  // Expose the aimed item to the host for "release the key to pick".
  useEffect(() => signal('wheel-aim', items[aim]), [aim, items])

  const onMove = (e) => {
    const r = ring.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    if (Math.hypot(dx, dy) < r.width * 0.16) return
    let a = Math.atan2(dy, dx) + Math.PI / 2
    if (a < 0) a += Math.PI * 2
    const i = Math.round((a / (Math.PI * 2)) * n) % n
    if (i !== aimRef.current) {
      setAim(i)
      beep('tick')
    }
  }

  const it = items[aim]
  const wedge = (Math.PI * 2) / n
  const a0 = angleOf(aim) - wedge / 2
  const a1 = a0 + wedge
  const arc = (r, a) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`
  const wedgePath = `M${arc(44, a0)} L${arc(97, a0)} A97 97 0 0 1 ${arc(97, a1)} L${arc(44, a1)} A44 44 0 0 0 ${arc(44, a0)}Z`

  return createPortal(
    <div className="gta-wheel-wrap" role="dialog" aria-modal="true" aria-label={title} onPointerMove={onMove}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gta-wheel" ref={ring} style={{ '--n': n }}>
        <svg viewBox="-100 -100 200 200" aria-hidden="true">
          <circle r="70" className="gta-wheel-ring" />
          <circle r="97" className="gta-wheel-edge" />
          <circle r="44" className="gta-wheel-edge" />
          {items.map((_, i) => {
            const a = angleOf(i) - wedge / 2
            return <path key={i} className="gta-wheel-split" d={`M${arc(44, a)} L${arc(97, a)}`} />
          })}
          <path className="gta-wheel-aim" d={wedgePath} />
        </svg>
        {items.map((item, i) => (
          <button
            type="button" key={item.id} className={`gta-wheel-item${i === aim ? ' aim' : ''}${item.id === current ? ' current' : ''}`}
            style={{ '--x': Math.cos(angleOf(i)).toFixed(3), '--y': Math.sin(angleOf(i)).toFixed(3) }}
            onClick={() => onPick(item)} onFocus={() => setAim(i)} aria-label={`${item.label}. ${item.sub}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
        <div className="gta-wheel-center">
          <small>{title}</small>
          <strong>{it.label}</strong>
          <span>{it.sub}</span>
          {center?.(it)}
        </div>
      </div>
      <p className="gta-wheel-hint">{hint}</p>
      <button type="button" className="gta-wheel-close" onClick={onClose}>✕ {closeLabel}</button>
    </div>,
    document.body,
  )
}

const HOLD_PICK = 260 // ms: held longer than this, releasing the key picks the aimed item

// Both wheels for one page. `page` is 'home' (character + tools) or 'arcade' (tools only).
// Opened by holding C or Q, or by a signal from a button: signal('wheel', 'character' | 'tools').
export default function Wheels({ page }) {
  const T = useGtaText()
  const [open, setOpen] = useState(null) // { kind, held, at }
  const aimed = useRef(null)
  const openRef = useRef(open)
  openRef.current = open

  const close = () => setOpen(null)

  const pick = (item) => {
    const kind = openRef.current?.kind
    setOpen(null)
    beep('good')
    if (kind === 'character') {
      writeGta({ persona: item.id })
      return
    }
    const tool = TOOLS.find((t) => t.id === item.id)
    if (page === 'arcade') {
      window.location.hash = tool.arcade
      return
    }
    signal('service', tool.service)
  }
  const pickRef = useRef(pick)
  pickRef.current = pick

  useEffect(() => onSignal('wheel', (kind) => setOpen({ kind, held: false, at: Date.now() })), [])
  useEffect(() => onSignal('wheel-aim', (item) => { aimed.current = item }), [])

  useEffect(() => {
    const keyFor = { c: 'character', q: 'tools' }
    const down = (e) => {
      if (e.repeat || typing(e)) return
      const kind = keyFor[e.key.toLowerCase()]
      if (!kind || (kind === 'character' && page !== 'home')) return
      if (document.querySelector('.gta-pause, .gta-modal')) return
      if (openRef.current?.kind === kind) return
      e.preventDefault()
      setOpen({ kind, held: true, at: Date.now() })
    }
    const up = (e) => {
      const o = openRef.current
      if (!o?.held || keyFor[e.key.toLowerCase()] !== o.kind) return
      if (Date.now() - o.at > HOLD_PICK && aimed.current) pickRef.current(aimed.current)
      else setOpen({ ...o, held: false }) // a tap: the wheel stays open for a click
    }
    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup', up)
    }
  }, [page])

  if (!open) return null
  const state = readGta()
  if (open.kind === 'character') {
    const items = PERSONAS.map((p) => ({ id: p.id, icon: p.icon, label: T.personas[p.id][0], sub: T.personas[p.id][1] }))
    return <Wheel title={T.wheel.character} items={items} current={state.persona} onPick={pick} onClose={close} hint={`${T.wheel.holdC} · ${T.wheel.pick}`} closeLabel={T.wheel.close} />
  }
  const items = TOOLS.map((t) => ({ id: t.id, icon: t.icon, label: T.tools[t.id][0], sub: T.tools[t.id][1] }))
  const center = page === 'home'
    ? (it) => <a className="gta-wheel-link" href={`arcade/${TOOLS.find((t) => t.id === it.id).arcade}`}>▶ {T.wheel.arcade}</a>
    : null
  return <Wheel title={T.wheel.tools} items={items} onPick={pick} onClose={close} center={center} hint={`${T.wheel.holdQ} · ${T.wheel.pick}`} closeLabel={T.wheel.close} />
}
