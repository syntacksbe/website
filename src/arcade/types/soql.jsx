import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { blockKind, columnsOf, compareResults, formatValue, get, lex, runSoql } from './soql.engine.js'
import './soql.css'

// "SOQL builder" round: tap token blocks into a query line, watch the live result table, run it.

// Token indexes in a random order that never matches the authored one (when there is more than one).
function shuffled(n) {
  const base = Array.from({ length: n }, (_, i) => i)
  if (n < 2) return base
  let out
  do {
    out = [...base]
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
  } while (out.every((x, i) => x === i))
  return out
}

const TONE = { kw: 'k', ident: 'f', str: 's', num: 'n', date: 'n', lit: 'n', bad: 'x', star: 'x' }

// Syntax-coloured SOQL.
function Code({ text }) {
  const parts = []
  let at = 0
  for (const t of lex(text)) {
    if (t.start > at) parts.push(<span key={`g${at}`}>{text.slice(at, t.start)}</span>)
    parts.push(<span key={t.start} className={`ar-soql-t-${TONE[t.type] ?? 'p'}`}>{t.text}</span>)
    at = t.end
  }
  if (at < text.length) parts.push(<span key={`g${at}`}>{text.slice(at)}</span>)
  return parts
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// A result table whose rows slide in when they appear and glide (FLIP) when the order changes.
function Table({ fields, rows, marks = {}, empty = 'No rows match this query.' }) {
  const refs = useRef(new Map())
  const tops = useRef(new Map())
  useLayoutEffect(() => {
    const still = reducedMotion()
    const next = new Map()
    refs.current.forEach((el, id) => {
      const top = el.offsetTop
      next.set(id, top)
      const before = tops.current.get(id)
      if (!still && before != null && before !== top && el.animate) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2, .8, .2, 1)' })
      }
    })
    tops.current = next
  })
  return (
    <div className="ar-soql-table-wrap">
      <table className="ar-soql-table">
        <thead>
          <tr>{fields.map((f) => <th key={f} scope="col">{f}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.Id}
              ref={(el) => (el ? refs.current.set(row.Id, el) : refs.current.delete(row.Id))}
              className={marks[row.Id] ?? undefined}
              style={{ '--i': i }}
            >
              {fields.map((f) => {
                const raw = get(row, f)
                const v = formatValue(raw)
                return <td key={f} className={v == null ? 'blank' : typeof raw === 'number' ? 'num' : undefined}>{v ?? '—'}</td>
              })}
            </tr>
          ))}
          {!rows.length && (
            <tr className="ar-soql-empty">
              <td colSpan={Math.max(1, fields.length)}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function SoqlRound({ round, done, onResult }) {
  const order = useMemo(() => shuffled(round.tokens.length), [round])
  const [placed, setPlaced] = useState([]) // token indexes, in query order
  const [running, setRunning] = useState(false)
  const [peek, setPeek] = useState(false)
  const [dragging, setDragging] = useState(null) // token index being dragged
  const [over, setOver] = useState(null) // token index the drag hovers (drop goes before it), or 'end'
  const fired = useRef(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const text = placed.map((ti) => round.tokens[ti]).join(' ')
  const live = useMemo(() => (text ? runSoql(text, round) : null), [text, round])
  const expected = useMemo(() => runSoql(round.answer, round), [round])
  const source = useMemo(() => ({ fields: [...columnsOf(round.data).values()].map((c) => c.path), rows: round.data }), [round])
  const verdict = useMemo(() => (done ? compareResults(expected, live) : null), [done, expected, live])
  const locked = done || running

  const move = (ti, before = null) => {
    if (locked || ti == null) return
    setPlaced((p) => {
      const rest = p.filter((x) => x !== ti)
      const at = before == null ? rest.length : rest.indexOf(before)
      rest.splice(at < 0 ? rest.length : at, 0, ti)
      return rest
    })
  }
  const remove = (ti) => !locked && setPlaced((p) => p.filter((x) => x !== ti))
  const nudge = (ti, dir) => {
    if (locked) return
    setPlaced((p) => {
      const i = p.indexOf(ti)
      const j = i + dir
      if (i < 0 || j < 0 || j >= p.length) return p
      const out = [...p]
      ;[out[i], out[j]] = [out[j], out[i]]
      return out
    })
  }

  const runQuery = () => {
    if (locked || !live?.ok || fired.current) return
    fired.current = true
    setRunning(true)
    const { score } = compareResults(expected, live)
    timer.current = setTimeout(() => {
      setRunning(false)
      onResult(score)
    }, reducedMotion() ? 0 : 750)
  }

  const drag = (ti) => ({
    draggable: !locked,
    onDragStart: (e) => {
      e.dataTransfer.setData('text/plain', String(ti))
      e.dataTransfer.effectAllowed = 'move'
      setDragging(ti)
    },
    onDragEnd: () => {
      setDragging(null)
      setOver(null)
    },
  })
  const dropOnLine = (e, before) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragging != null && dragging !== before) move(dragging, before)
    setDragging(null)
    setOver(null)
  }

  let status
  let tone
  if (running) [status, tone] = ['Running query…', 'run']
  else if (!live) [status, tone] = ['Tap a block to start. Every query starts with SELECT.', 'hint']
  else if (!live.ok) [status, tone] = [live.error, live.partial ? 'hint' : 'bad']
  else [status, tone] = [`Valid SOQL: ${plural(live.rows.length, 'row')}. Run it when it matches the brief.`, 'ok']

  const showSource = !done && (peek || !live?.ok)
  const lineState = done ? ` done ${verdict.score === 1 ? 'right' : verdict.score > 0 ? 'half' : 'wrong'}` : running ? ' running' : live?.ok ? ' ok' : live && !live.partial ? ' bad' : ''

  // Marks for the reveal: your rows (right, extra, out of place) and the expected ones you missed.
  const mine = {}
  const theirs = {}
  if (verdict && live?.ok) {
    const want = expected.rows.map((r) => r.Id)
    live.rows.forEach((r, i) => {
      mine[r.Id] = !want.includes(r.Id) ? 'wrong' : verdict.rowsOk && !verdict.orderOk && want[i] !== r.Id ? 'moved' : 'right'
    })
    verdict.missing.forEach((id) => { theirs[id] = 'missing' })
  }

  return (
    <div className="ar-soql">
      <p className="ar-q"><span className="ar-soql-kicker">Brief</span>{round.q}</p>

      <div className="ar-soql-console">
        <div
          className={`ar-soql-line${lineState}${over === 'end' ? ' drop-end' : ''}`}
          role="group"
          aria-label="Your query"
          onDragOver={(e) => {
            if (dragging == null) return
            e.preventDefault()
            if (e.target === e.currentTarget) setOver('end')
          }}
          onDragLeave={(e) => e.target === e.currentTarget && setOver(null)}
          onDrop={(e) => dropOnLine(e, null)}
        >
          <span className="ar-soql-prompt" aria-hidden="true">&gt;</span>
          {!placed.length && <span className="ar-soql-placeholder">Your query goes here</span>}
          {placed.map((ti, pos) => (
            <button
              type="button"
              key={ti}
              className={`ar-soql-block ${blockKind(round.tokens[ti])}${over === ti ? ' drop-before' : ''}${dragging === ti ? ' dragging' : ''}`}
              onClick={() => remove(ti)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  nudge(ti, e.key === 'ArrowLeft' ? -1 : 1)
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault()
                  remove(ti)
                }
              }}
              onDragOver={(e) => {
                if (dragging == null) return
                e.preventDefault()
                e.stopPropagation()
                setOver(ti)
              }}
              onDrop={(e) => dropOnLine(e, ti)}
              disabled={locked}
              aria-label={`Block ${pos + 1}: ${round.tokens[ti]}. Press to take it back, arrow keys to move it.`}
              {...drag(ti)}
            >
              <Code text={round.tokens[ti]} />
            </button>
          ))}
          {!locked && <span className="ar-soql-caret" aria-hidden="true" />}
        </div>
        {!done && <p className={`ar-soql-status ${tone}`} role="status" aria-live="polite">{status}</p>}
      </div>

      {!done && (
        <>
          <div
            className="ar-soql-pool"
            aria-label="Blocks"
            onDragOver={(e) => dragging != null && placed.includes(dragging) && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragging != null) remove(dragging)
              setDragging(null)
              setOver(null)
            }}
          >
            {order.map((ti) =>
              placed.includes(ti) ? (
                <span key={ti} className={`ar-soql-chip ghost ${blockKind(round.tokens[ti])}`} aria-hidden="true"><Code text={round.tokens[ti]} /></span>
              ) : (
                <button type="button" key={ti} className={`ar-soql-chip ${blockKind(round.tokens[ti])}`} onClick={() => move(ti)} disabled={locked} {...drag(ti)}>
                  <Code text={round.tokens[ti]} />
                </button>
              ),
            )}
          </div>
          <div className="ar-soql-actions">
            <button type="button" className="ar-soql-tool" onClick={() => remove(placed[placed.length - 1])} disabled={locked || !placed.length}>↶ Undo</button>
            <button type="button" className="ar-soql-tool" onClick={() => !locked && setPlaced([])} disabled={locked || !placed.length}>✕ Clear</button>
            <button type="button" className={`btn btn-primary btn-sm ar-soql-run${running ? ' running' : ''}`} onClick={runQuery} disabled={locked || !live?.ok}>
              {running ? 'Running…' : '▶ Run query'}
            </button>
          </div>
        </>
      )}

      {done && verdict && (
        <div className={`ar-soql-verdict ${verdict.score === 1 ? 'right' : verdict.score > 0 ? 'half' : 'wrong'}`}>
          <span className="ar-soql-stamp">{verdict.score === 1 ? 'Query passed' : verdict.score > 0 ? 'Close call' : 'Wrong rows'}</span>
          <ul className="ar-soql-checks">
            <li className={verdict.rowsOk ? 'ok' : 'no'}>
              <b>Rows</b>
              {verdict.rowsOk
                ? `all ${expected.rows.length} right`
                : [verdict.missing.length && `${verdict.missing.length} missing`, verdict.extra.length && `${verdict.extra.length} extra`].filter(Boolean).join(', ') || 'not the expected records'}
            </li>
            <li className={verdict.fieldsOk ? 'ok' : 'no'}>
              <b>Fields</b>
              {verdict.fieldsOk ? 'exactly what was asked' : `asked for ${expected.fields.join(', ')}`}
            </li>
            {verdict.orderMatters && (
              <li className={verdict.orderOk ? 'ok' : 'no'}>
                <b>Order</b>
                {verdict.orderOk ? 'spot on' : verdict.rowsOk ? 'right rows, wrong order' : 'follows the rows'}
              </li>
            )}
          </ul>
        </div>
      )}

      <section className={`ar-soql-results${done ? ' done' : ''}`} aria-label={showSource ? 'Source data' : 'Query result'}>
        <header className="ar-soql-results-head">
          <span className="ar-soql-label">
            {showSource ? <>Source data · {round.object}</> : done ? 'Your result' : 'Live preview'}
          </span>
          <span className="ar-soql-count" key={showSource ? 'all' : live?.rows?.length}>
            {showSource ? plural(source.rows.length, 'record') : `${live?.rows?.length ?? 0} of ${source.rows.length}`}
          </span>
          {!done && live?.ok && (
            <button type="button" className="ar-soql-tool small" onClick={() => setPeek((v) => !v)} aria-pressed={peek}>
              {peek ? '← My result' : '👁 Peek at the data'}
            </button>
          )}
        </header>
        {showSource ? (
          <Table fields={source.fields} rows={source.rows} />
        ) : (
          <Table fields={live?.ok ? live.fields : []} rows={live?.ok ? live.rows : []} marks={mine} />
        )}
      </section>

      {done && (
        <section className="ar-soql-answer" aria-label="Reference answer">
          <span className="ar-soql-label">Reference query</span>
          <pre className="ar-soql-ref"><Code text={round.answer} /></pre>
          {verdict?.score < 1 && (
            <>
              <header className="ar-soql-results-head">
                <span className="ar-soql-label">Expected rows</span>
                <span className="ar-soql-count">{expected.rows.length} of {source.rows.length}</span>
              </header>
              <Table fields={expected.fields} rows={expected.rows} marks={theirs} />
            </>
          )}
        </section>
      )}
    </div>
  )
}
