import { useEffect, useMemo, useRef, useState } from 'react'
import { beep, burst, haptic } from './fx.js'

// One component per game type. Each shows a single round and calls onResult(score) once, with a
// score from 0 to 1; after that it shows what was right (the player then moves on).

function shuffle(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// A shuffle that never returns the original order (when there is more than one item).
function mixed(list) {
  if (list.length < 2) return [...list]
  let out = shuffle(list)
  while (out.every((x, i) => x === list[i])) out = shuffle(list)
  return out
}

// How a listing reads best: real code keeps a code view; settings, rules and schemas become a
// settings card; aligned columns become a table. A round can force one with `view`.
const CODE_LINE = /[{};]\s*$|^\s*[<{}[\]]|^\s*-\s|^\s*(SELECT|FROM|WHERE|ORDER|LIMIT|sf\s|POST\s|GET\s|PATCH\s|trigger\s|public\s|private\s|global\s|@|\/\/)/i

export function viewFor(code, forced) {
  if (forced) return forced
  const lines = code.split('\n').filter((l) => l.trim())
  if (lines.some((l) => CODE_LINE.test(l))) return 'code'
  const cols = lines.map((l) => l.trim().split(/\s{2,}/).length)
  if (lines.length >= 3 && cols[0] >= 2 && cols.every((n) => n === cols[0]) && !lines.some((l) => /:\s/.test(l))) return 'table'
  return 'config'
}

const pretty = (text) => text.replace(/\s*->\s*/g, ' → ')

// "Tier 2: 100–499 units → 20%" → key 'Tier 2', value '100–499 units → 20%'; indented lines nest under the one above.
function parseRow(line) {
  const depth = Math.min(3, Math.floor((line.length - line.trimStart().length) / 2))
  const text = line.trim()
  const colon = text.match(/^([^:()"'=<>]{1,40}?):\s+(.+)$/)
  if (colon) return { depth, key: colon[1], value: pretty(colon[2]) }
  const spaced = text.split(/\s{2,}/)
  if (spaced.length >= 2) return { depth, key: spaced[0], value: pretty(spaced.slice(1).join('  ')) }
  if (/:$/.test(text)) return { depth, key: text.slice(0, -1), value: '' }
  return { depth, key: '', value: pretty(text), formula: /[()=,]/.test(text) }
}

export function Listing({ code, view, pick, marks }) {
  const mode = viewFor(code, view)
  const lines = code.split('\n')
  const cls = (i, base) => `${base}${marks?.[i] ? ` ${marks[i]}` : ''}`
  const pickable = (i, label) =>
    pick
      ? {
          role: 'button',
          tabIndex: 0,
          onClick: () => pick(i),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              pick(i)
            }
          },
          'aria-label': `Line ${i + 1}: ${label}`,
        }
      : {}

  if (mode === 'table') {
    const rows = lines.map((l) => l.trim().split(/\s{2,}/))
    return (
      <div className="ar-table-wrap">
        <table className={`ar-table${pick ? ' pick' : ''}`}>
          <thead>
            <tr className={cls(0, 'ar-trow')} {...pickable(0, lines[0].trim())}>{rows[0].map((c, j) => <th key={j}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(1).map((r, k) => (
              <tr key={k} className={cls(k + 1, 'ar-trow')} {...pickable(k + 1, lines[k + 1].trim())}>
                {r.map((c, j) => <td key={j}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (mode === 'config') {
    return (
      <div className={`ar-config${pick ? ' pick' : ''}`}>
        {lines.map((line, i) => {
          if (!line.trim()) return null
          const row = parseRow(line)
          const kind = `${row.formula ? ' formula' : ''}${row.key && !row.value ? ' head' : ''}${!row.key ? ' solo' : ''}`
          return (
            <div key={i} className={cls(i, `ar-crow d${row.depth}${kind}`)} {...pickable(i, line.trim())}>
              {row.key && <span className="ar-ckey">{row.key}</span>}
              {row.value && <span className="ar-cval">{row.value}</span>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <pre className={`ar-code${pick ? ' pick' : ''}`}>
      {lines.map((line, i) => (
        <span key={i} className={cls(i, 'ar-line')} {...pickable(i, line.trim() || 'empty')}>
          <span className="ar-ln" aria-hidden="true">{i + 1}</span>
          <span className="ar-lt">{line || ' '}</span>
        </span>
      ))}
    </pre>
  )
}

export function Quiz({ round, done, onResult }) {
  const [chosen, setChosen] = useState(null)
  const choose = (i) => {
    if (done) return
    setChosen(i)
    onResult(i === round.answer ? 1 : 0)
  }
  return (
    <>
      <p className="ar-q">{round.q}</p>
      {round.code && <Listing code={round.code} view={round.view} />}
      <div className="ar-options">
        {round.options.map((o, i) => {
          const state = !done ? '' : i === round.answer ? ' right' : i === chosen ? ' wrong' : ' dim'
          return (
            <button type="button" key={o} className={`ar-option${state}`} onClick={() => choose(i)} disabled={done}>
              <b aria-hidden="true">{'ABCD'[i]}</b>{o}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function Bug({ round, done, onResult }) {
  const [chosen, setChosen] = useState(null)
  const bugs = [].concat(round.bug)
  const pick = (i) => {
    if (done) return
    setChosen(i)
    onResult(bugs.includes(i) ? 1 : 0)
  }
  const marks = {}
  if (done) {
    if (chosen != null && !bugs.includes(chosen)) marks[chosen] = 'wrong'
    bugs.forEach((b) => { marks[b] = 'right' })
  }
  return (
    <>
      <p className="ar-q">{round.q}</p>
      <p className="ar-help">{done ? ' ' : { code: '👆 Tap the line with the problem.', table: '👆 Tap the row that’s wrong.', config: '👆 Tap the setting that’s wrong.' }[viewFor(round.code, round.view)]}</p>
      <Listing code={round.code} view={round.view} pick={done ? null : pick} marks={marks} />
    </>
  )
}

export function Order({ round, done, onResult }) {
  const pool = useMemo(() => mixed(round.items), [round])
  const [picked, setPicked] = useState([])
  const add = (item) => {
    if (done || picked.includes(item)) return
    const next = [...picked, item]
    setPicked(next)
    if (next.length === round.items.length) onResult(next.every((x, i) => x === round.items[i]) ? 1 : 0)
  }
  const remove = (item) => !done && setPicked(picked.filter((x) => x !== item))
  return (
    <>
      <p className="ar-q">{round.q}</p>
      <ol className="ar-slots">
        {round.items.map((correct, i) => {
          const item = picked[i]
          const state = done ? (item === correct ? ' right' : ' wrong') : item ? ' filled' : ''
          return (
            <li key={i} className={`ar-slot${state}`}>
              <b aria-hidden="true">{i + 1}</b>
              {item ? (
                <button type="button" onClick={() => remove(item)} disabled={done} title={done ? undefined : 'Tap to take it back'}>{item}</button>
              ) : (
                <span>{i === picked.length ? 'Tap the next step below' : ''}</span>
              )}
              {done && item !== correct && <small>✓ {correct}</small>}
            </li>
          )
        })}
      </ol>
      {!done && (
        <div className="ar-pool">
          {pool.filter((x) => !picked.includes(x)).map((x) => (
            <button type="button" key={x} className="ar-chip" onClick={() => add(x)}>{x}</button>
          ))}
        </div>
      )}
    </>
  )
}

export function Sort({ round, game, done, onResult }) {
  const [chosen, setChosen] = useState(null)
  // A sort lock in an escape room brings its own buckets.
  const buckets = round.buckets ?? game.buckets
  const choose = (i) => {
    if (done) return
    setChosen(i)
    onResult(i === round.bucket ? 1 : 0)
  }
  return (
    <>
      <p className="ar-help">Where does this one go?</p>
      <p className="ar-card">{round.text}</p>
      <div className="ar-buckets" style={{ '--n': buckets.length }}>
        {buckets.map((b, i) => {
          const state = !done ? '' : i === round.bucket ? ' right' : i === chosen ? ' wrong' : ' dim'
          return (
            <button type="button" key={b} className={`ar-bucket${state}`} onClick={() => choose(i)} disabled={done}>
              <span aria-hidden="true">🗂️</span>{b}
            </button>
          )
        })}
      </div>
    </>
  )
}

const PAIR_COLORS = ['#1fb5ad', '#ff7a33', '#ffb21a', '#e0457b', '#7c8cff']

// A curved connector from the right edge of one card to the left edge of the other.
function curve(a, b) {
  const mid = (b.x - a.x) / 2
  return `M${a.x} ${a.y} C${a.x + mid} ${a.y} ${b.x - mid} ${b.y} ${b.x} ${b.y}`
}

export function Match({ round, done, onResult }) {
  const rights = useMemo(() => mixed(round.pairs.map((p) => p[1])), [round])
  const answer = useMemo(() => Object.fromEntries(round.pairs), [round])
  const [left, setLeft] = useState(null) // selected left card
  const [paired, setPaired] = useState([]) // left labels matched so far, in order
  const [misses, setMisses] = useState(0)
  const [miss, setMiss] = useState(null) // { l, r } of the last wrong try, drawn as a fizzling line
  const [pointer, setPointer] = useState(null) // live line end while a card is selected
  const [, setLayout] = useState(0)
  const box = useRef(null)
  const cards = useRef({})
  const dragging = useRef(false)
  const selected = useRef(null) // mirrors `left` for pointer handlers that fire before a re-render
  const select = (l) => {
    selected.current = l
    setLeft(l)
  }

  // Re-measure the card positions when the layout changes.
  useEffect(() => {
    const ro = new ResizeObserver(() => setLayout((n) => n + 1))
    if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const anchor = (key, side) => {
    const el = cards.current[key]
    const host = box.current?.getBoundingClientRect()
    if (!el || !host) return null
    const r = el.getBoundingClientRect()
    return { x: (side === 'right' ? r.right : r.left) - host.left, y: r.top + r.height / 2 - host.top }
  }

  function tryMatch(l, r) {
    if (done || l == null || paired.includes(l)) return
    if (answer[l] === r) {
      const next = [...paired, l]
      setPaired(next)
      select(null)
      setPointer(null)
      burst({ count: 10 })
      beep('good', next.length)
      haptic(12)
      if (next.length === round.pairs.length) onResult(round.pairs.length / (round.pairs.length + misses))
    } else {
      setMisses((m) => m + 1)
      setMiss({ l, r })
      setTimeout(() => setMiss(null), 600)
      beep('bad')
      haptic([25, 30, 25])
    }
  }

  // Drag from a left card and drop on a right card; a plain tap selects instead.
  function down(l, e) {
    if (done || paired.includes(l)) return
    if (selected.current === l) {
      select(null)
      setPointer(null)
      return
    }
    select(l)
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    move(e)
  }
  function move(e) {
    if (selected.current == null && !dragging.current) return
    const host = box.current?.getBoundingClientRect()
    if (host) setPointer({ x: e.clientX - host.left, y: e.clientY - host.top })
  }
  function up(e) {
    if (!dragging.current) return
    dragging.current = false
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-right]')
    if (target) tryMatch(selected.current, target.dataset.right)
  }

  const colorOf = (l) => PAIR_COLORS[round.pairs.findIndex((p) => p[0] === l) % PAIR_COLORS.length]
  const matchedRight = new Set(paired.map((l) => answer[l]))
  const from = left != null && anchor(`l:${left}`, 'right')

  return (
    <>
      <p className="ar-q">{round.q}</p>
      <p className="ar-help">
        {done ? (misses ? `${misses} wrong ${misses > 1 ? 'tries' : 'try'}` : 'Perfect: no mistakes') : 'Drag a line from a card on the left to its match, or tap one, then the other.'}
      </p>
      <div className="ar-match" ref={box} onPointerMove={move} onPointerUp={up} onPointerLeave={() => !dragging.current && setPointer(null)}>
        <svg className="ar-wires" aria-hidden="true">
          {paired.map((l) => {
            const a = anchor(`l:${l}`, 'right')
            const b = anchor(`r:${answer[l]}`, 'left')
            if (!a || !b) return null
            const d = curve(a, b)
            return (
              <g key={l} style={{ '--c': colorOf(l) }}>
                <path className="ar-wire" d={d} pathLength="1" />
                <circle className="ar-spark" r="4"><animateMotion dur="0.7s" fill="freeze" path={d} /></circle>
              </g>
            )
          })}
          {miss && (() => {
            const a = anchor(`l:${miss.l}`, 'right')
            const b = anchor(`r:${miss.r}`, 'left')
            return a && b ? <path className="ar-wire miss" d={curve(a, b)} pathLength="1" /> : null
          })()}
          {from && pointer && pointer.x > from.x + 12 && !done && <path className="ar-wire live" d={curve(from, pointer)} />}
        </svg>
        <div className="ar-match-col">
          {round.pairs.map(([l]) => (
            <button
              type="button" key={l} ref={(el) => { cards.current[`l:${l}`] = el }}
              disabled={done || paired.includes(l)} aria-pressed={left === l}
              className={`ar-pair left${paired.includes(l) ? ' right' : ''}${miss?.l === l ? ' wrong' : ''}`}
              style={paired.includes(l) ? { '--c': colorOf(l) } : undefined}
              onPointerDown={(e) => down(l, e)}
              onClick={(e) => { if (e.detail === 0) select(left === l ? null : l) }} // keyboard
            >
              {l}
              <span className="ar-port" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="ar-match-col">
          {rights.map((r) => {
            const owner = paired.find((l) => answer[l] === r)
            return (
              <button
                type="button" key={r} data-right={r} ref={(el) => { cards.current[`r:${r}`] = el }}
                disabled={done || matchedRight.has(r)}
                className={`ar-pair rightside${matchedRight.has(r) ? ' right' : ''}${miss?.r === r ? ' wrong' : ''}`}
                style={owner ? { '--c': colorOf(owner) } : undefined}
                onClick={() => tryMatch(selected.current, r)}
              >
                <span className="ar-port" aria-hidden="true" />
                {r}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export const ROUNDS = { quiz: Quiz, bug: Bug, order: Order, sort: Sort, match: Match }
