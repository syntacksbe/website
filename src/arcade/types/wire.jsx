import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './wire.css'

// "Wire it up": drag from a node's port to another node (or tap one node, then the other) to wire
// the architecture, then press Run. Wires always flow from an earlier column to a later one; when
// the board is too narrow for its columns, the columns become rows and the flow runs top to bottom.

const COL_MIN = 165 // px each column needs before the board flips to rows
const STEP = 220 // ms between the packets of one column and the next
const wireKey = (a, b) => `${a}>${b}`

export default function Wire({ round, done, onResult }) {
  const byId = useMemo(() => Object.fromEntries(round.nodes.map((n) => [n.id, n])), [round])
  const columns = useMemo(() => {
    const count = Math.max(...round.nodes.map((n) => n.col)) + 1
    return Array.from({ length: count }, (_, c) => round.nodes.filter((n) => n.col === c))
  }, [round])
  const expected = useMemo(() => new Set(round.answer.map(([a, b]) => wireKey(a, b))), [round])
  const needed = useMemo(() => new Set(round.answer.flat()), [round])

  const boardRef = useRef(null)
  const nodeRefs = useRef({})
  const gesture = useRef(null) // { id, port, x0, y0, moved }
  const swallowClick = useRef(false)
  const ran = useRef(false)
  const timer = useRef(null)
  const glow = `ar-wire-glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const [mode, setMode] = useState('cols')
  const [box, setBox] = useState({ w: 0, h: 0, nodes: {} })
  const [wires, setWires] = useState([]) // [[from, to]], from in the earlier column
  const [pending, setPending] = useState(null) // node picked by a tap, waiting for its target
  const [drag, setDrag] = useState(null) // { from, x, y, over }
  const [running, setRunning] = useState(false)
  const locked = done || running

  const measure = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const b = board.getBoundingClientRect()
    const ox = b.left + board.clientLeft
    const oy = b.top + board.clientTop
    const next = board.clientWidth < columns.length * COL_MIN ? 'rows' : 'cols'
    setMode((m) => (m === next ? m : next))
    const nodes = {}
    for (const [id, el] of Object.entries(nodeRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      nodes[id] = { x: r.left - ox, y: r.top - oy, w: r.width, h: r.height }
    }
    setBox({ w: board.clientWidth, h: board.clientHeight, nodes })
  }, [columns.length])

  useLayoutEffect(() => {
    measure()
  }, [measure, mode])

  useEffect(() => {
    const board = boardRef.current
    let alive = true
    document.fonts?.ready?.then(() => alive && measure())
    if (!board || typeof ResizeObserver === 'undefined') return () => { alive = false }
    const ro = new ResizeObserver(() => measure())
    ro.observe(board)
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [measure])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Geometry: output ports on the right (or bottom), inputs on the left (or top).
  const port = (id, side) => {
    const n = box.nodes[id]
    if (!n) return null
    if (mode === 'rows') return side === 'out' ? [n.x + n.w / 2, n.y + n.h] : [n.x + n.w / 2, n.y]
    return side === 'out' ? [n.x + n.w, n.y + n.h / 2] : [n.x, n.y + n.h / 2]
  }
  const curve = ([x1, y1], [x2, y2]) => {
    if (mode === 'rows') {
      const d = Math.max(24, Math.abs(y2 - y1) / 2)
      return `M${x1} ${y1} C${x1} ${y1 + d} ${x2} ${y2 - d} ${x2} ${y2}`
    }
    const d = Math.max(30, Math.abs(x2 - x1) / 2)
    return `M${x1} ${y1} C${x1 + d} ${y1} ${x2 - d} ${y2} ${x2} ${y2}`
  }
  const pathFor = (a, b) => {
    const p = port(a, 'out')
    const q = port(b, 'in')
    return p && q ? curve(p, q) : null
  }

  const has = (a, b) => wires.some(([f, t]) => f === a && t === b)
  const linked = new Set(wires.flat())

  // Toggles the wire between two nodes in different columns; false when they can't be wired.
  function connect(a, b) {
    const A = byId[a]
    const B = byId[b]
    if (!A || !B || a === b || A.col === B.col) return false
    const [from, to] = A.col < B.col ? [a, b] : [b, a]
    setWires((ws) => (ws.some(([f, t]) => f === from && t === to) ? ws.filter(([f, t]) => !(f === from && t === to)) : [...ws, [from, to]]))
    return true
  }
  const unplug = (a, b) => !locked && setWires((ws) => ws.filter(([f, t]) => !(f === a && t === b)))

  function tap(id) {
    if (locked) return
    if (pending == null || pending === id) return setPending(pending === id ? null : id)
    if (connect(pending, id)) setPending(null)
    else setPending(id)
  }

  const nodeAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-wire-node]')?.dataset.wireNode ?? null

  // Pointer drags: from a port with any pointer, from a card with a mouse (touch on a card scrolls or taps).
  function down(e, id, fromPort) {
    if (locked || e.button > 0) return
    if (!fromPort && e.pointerType !== 'mouse') return
    if (fromPort) e.preventDefault()
    gesture.current = { id, port: fromPort, x0: e.clientX, y0: e.clientY, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function move(e) {
    const g = gesture.current
    if (!g || !boardRef.current) return
    if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return
    g.moved = true
    const board = boardRef.current
    const b = board.getBoundingClientRect()
    const over = nodeAt(e.clientX, e.clientY)
    setDrag({
      from: g.id,
      x: e.clientX - b.left - board.clientLeft,
      y: e.clientY - b.top - board.clientTop,
      over: over && over !== g.id && byId[over]?.col !== byId[g.id].col ? over : null,
    })
  }
  function up(e) {
    const g = gesture.current
    if (!g) return
    gesture.current = null
    setDrag(null)
    if (!g.moved) {
      if (g.port) tap(g.id) // a card's own click event handles a plain click
      return
    }
    if (!g.port) {
      swallowClick.current = true
      setTimeout(() => { swallowClick.current = false }, 0)
    }
    const target = nodeAt(e.clientX, e.clientY)
    if (target && target !== g.id) connect(g.id, target)
    setPending(null)
  }
  function cancel() {
    gesture.current = null
    setDrag(null)
  }

  function run() {
    if (locked || ran.current || !wires.length) return
    ran.current = true
    setPending(null)
    setRunning(true)
    const right = wires.filter(([a, b]) => expected.has(wireKey(a, b))).length
    const score = right / (expected.size + wires.length - right)
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(() => onResult(score), calm ? 120 : 850 + (columns.length - 2) * STEP)
  }

  const right = wires.filter(([a, b]) => expected.has(wireKey(a, b))).length
  const missing = round.answer.filter(([a, b]) => !has(a, b))
  const help = done
    ? `${right} of ${expected.size} wires right${wires.length - right ? ` · ${wires.length - right} wrong` : ''}${missing.length ? ` · ${missing.length} missing (dashed)` : ''}`
    : running
      ? 'Sending test packets…'
      : pending
        ? `${byId[pending].label} picked. Tap where it connects, or tap it again to cancel.`
        : 'Drag from a node’s ● port to the next step, or tap one node and then the other. Tap a wire to unplug it. Not every node belongs.'

  let dragPath = null
  if (drag) {
    const p = port(drag.from, 'out')
    if (p) dragPath = drag.over ? pathFor(...(byId[drag.from].col < byId[drag.over].col ? [drag.from, drag.over] : [drag.over, drag.from])) : curve(p, [drag.x, drag.y])
  }

  return (
    <>
      <p className="ar-q">{round.q}</p>
      <p className="ar-help" aria-live="polite">{help}</p>

      <div ref={boardRef} className={`ar-wire-board ${mode}${done ? ' done' : ''}`} style={{ '--cols': columns.length }}>
        <svg className="ar-wire-svg" width={box.w} height={box.h} aria-hidden="true">
          <defs>
            <filter id={glow} filterUnits="userSpaceOnUse" x="0" y="0" width={box.w || 1} height={box.h || 1}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {done && missing.map(([a, b]) => {
            const d = pathFor(a, b)
            return d && <path key={`ghost-${wireKey(a, b)}`} className="ar-wire-ghost" d={d} />
          })}
          {wires.map(([a, b]) => {
            const d = pathFor(a, b)
            if (!d) return null
            const state = done ? (expected.has(wireKey(a, b)) ? ' right' : ' wrong') : running ? ' live' : ''
            return (
              <g key={wireKey(a, b)} className={`ar-wire-link${state}`} style={{ '--d': `${byId[a].col * STEP}ms` }}>
                <path className="ar-wire-path" d={d} pathLength="100" filter={state === ' right' ? `url(#${glow})` : undefined} />
                {(state === ' live' || state === ' right') && <path className="ar-wire-packet" d={d} pathLength="100" filter={`url(#${glow})`} />}
                {!locked && <path className="ar-wire-hit" d={d} onClick={() => unplug(a, b)} />}
              </g>
            )
          })}
          {dragPath && <path className={`ar-wire-drag${drag.over ? ' snap' : ''}`} d={dragPath} />}
        </svg>

        <div className="ar-wire-cols">
          {columns.map((list, c) => (
            <div className="ar-wire-col" key={c}>
              {list.map((n) => {
                const picked = pending === n.id || drag?.from === n.id
                const cls = [
                  picked && 'on',
                  drag?.over === n.id && 'over',
                  linked.has(n.id) && 'linked',
                  done && (needed.has(n.id) ? 'need' : 'decoy'),
                ].filter(Boolean).map((x) => ` ${x}`).join('')
                return (
                  <div key={n.id} className={`ar-wire-node${cls}`} data-wire-node={n.id} ref={(el) => { nodeRefs.current[n.id] = el }}>
                    <button
                      type="button" className="ar-wire-card" disabled={locked} aria-pressed={pending === n.id}
                      onClick={() => {
                        if (swallowClick.current) return
                        tap(n.id)
                      }}
                      onPointerDown={(e) => down(e, n.id, false)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
                    >
                      <span className="ar-wire-icon" aria-hidden="true">{n.icon}</span>
                      <span className="ar-wire-label">{n.label}</span>
                    </button>
                    {c > 0 && <span className="ar-wire-socket" aria-hidden="true" />}
                    {c < columns.length - 1 && !locked && (
                      <span
                        className={`ar-wire-port${wires.length ? '' : ' hint'}`} aria-hidden="true"
                        onPointerDown={(e) => down(e, n.id, true)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ar-wire-bar">
        <ul className="ar-wire-list" aria-label="Your wires">
          {wires.map(([a, b]) => {
            const state = done ? (expected.has(wireKey(a, b)) ? ' right' : ' wrong') : ''
            return (
              <li key={wireKey(a, b)} className={state.trim() || undefined}>
                <button type="button" disabled={locked} onClick={() => unplug(a, b)} aria-label={`${byId[a].label} to ${byId[b].label}${locked ? '' : ', tap to unplug'}`}>
                  {byId[a].label} <b aria-hidden="true">→</b> {byId[b].label}{!locked && <i aria-hidden="true">✕</i>}
                </button>
              </li>
            )
          })}
          {!wires.length && <li className="empty">No wires yet</li>}
        </ul>
        {!done && (
          <div className="ar-wire-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setWires([]); setPending(null) }} disabled={locked || !wires.length}>Unplug all</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={run} disabled={locked || !wires.length}>{running ? 'Running…' : '▶ Run'}</button>
          </div>
        )}
      </div>
    </>
  )
}
