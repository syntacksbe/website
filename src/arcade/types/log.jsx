import { useEffect, useMemo, useRef, useState } from 'react'
import { STAMP, entryKey } from './log.check.js'
import './log.css'

// Log detective: filter a debug log, pin clue lines as evidence, then accuse one suspect.
// Score: 0.6 for the right culprit + 0.4 × the share of clue lines pinned.

const KINDS = [
  ['soql', 'SOQL'],
  ['dml', 'DML'],
  ['debug', 'DEBUG'],
  ['error', 'ERROR'],
  ['limits', 'LIMITS'],
  ['callout', 'CALLOUT'],
  ['flow', 'FLOW'],
]

function kindOf(event) {
  if (/^SOQL_|^SOSL_/.test(event)) return 'soql'
  if (/^DML_/.test(event)) return 'dml'
  if (event === 'USER_DEBUG') return 'debug'
  if (/EXCEPTION|FATAL|_ERROR$|_FAIL$|_FAULT/.test(event)) return 'error'
  if (/LIMIT/.test(event)) return 'limits'
  if (/CALLOUT|NAMED_CREDENTIAL/.test(event)) return 'callout'
  if (/^FLOW_|^WF_|^VALIDATION_/.test(event)) return 'flow'
  return 'code'
}

// Lines without a timestamp (stack traces, limit details) belong to the entry above them.
function parse(log) {
  let prev = 'code'
  return log.split('\n').map((raw, i) => {
    const m = raw.match(STAMP)
    const key = entryKey(raw)
    if (!m) return { i, raw, key, rest: raw, kind: i === 0 || !raw.trim() ? 'code' : prev, head: i === 0 }
    const after = raw.slice(m[0].length)
    const bar = after.indexOf('|')
    const event = bar < 0 ? after : after.slice(0, bar)
    const kind = kindOf(event)
    prev = kind
    return { i, raw, key, time: m[1], nanos: m[2] ?? '', event, rest: bar < 0 ? '' : after.slice(bar + 1), kind }
  })
}

// Dim the pipes and flag "CLOSE TO LIMIT" so the eye lands on the values.
function Rest({ text }) {
  const parts = text.split(/(\||\*+ CLOSE TO LIMIT)/)
  return parts.map((p, k) => {
    if (p === '|') return <i key={k} className="ar-log-pipe">|</i>
    if (/CLOSE TO LIMIT/.test(p)) return <b key={k} className="ar-log-hot">{p}</b>
    return p
  })
}

const TAGS = { pinned: '📌 Evidence', good: '✓ Evidence', herring: 'Red herring', missed: 'Missed clue' }

export default function LogRound({ round, game, done, onResult }) {
  const lines = useMemo(() => parse(round.log), [round])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pins, setPins] = useState([])
  const [full, setFull] = useState(false)
  const [chosen, setChosen] = useState(null)
  const sent = useRef(false)
  const viewer = useRef(null)
  const root = useRef(null)

  const maxPins = round.clues.length + 1
  const clueKeys = new Set(round.clues.map((c) => lines[c].key))
  const pinnedKeys = new Set(pins.map((p) => lines[p].key))
  const found = round.clues.filter((c) => pinnedKeys.has(lines[c].key)).length
  const caseNo = String(game.rounds.indexOf(round) + 1).padStart(2, '0')

  // After the verdict, show the whole log and bring the first clue into view.
  const kind = done ? 'all' : filter
  const query = done ? '' : search.trim().toLowerCase()
  useEffect(() => {
    if (!done || !viewer.current) return
    const first = viewer.current.querySelector(`[data-line="${Math.min(...round.clues)}"]`)
    const bar = viewer.current.querySelector('.ar-log-bar')
    if (first) viewer.current.scrollTop = Math.max(0, first.offsetTop - (bar?.offsetHeight ?? 0) - 24)
  }, [done, round])

  // The case fits one screen: bring the round (from its score bar down) into view when it starts.
  // If a small screen can't hold all of it, the suspects and the accuse button win over the bar.
  useEffect(() => {
    const id = setTimeout(() => {
      const panel = root.current?.closest('.ar-round')
      const bar = panel?.querySelector('.ar-round-bar') ?? panel
      if (!bar || panel.getBoundingClientRect().bottom <= window.innerHeight) return
      const nav = document.querySelector('.nav')?.offsetHeight ?? 0
      const fromBar = bar.getBoundingClientRect().top + window.scrollY - nav - 10
      const last = root.current.querySelector('.ar-log-side')?.lastElementChild ?? root.current
      const toEnd = last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 12
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: Math.max(fromBar, toEnd), behavior: smooth ? 'smooth' : 'instant' })
    }, 60)
    return () => clearTimeout(id)
  }, [round])

  const counts = {}
  lines.forEach((l) => { counts[l.kind] = (counts[l.kind] ?? 0) + 1 })
  const shown = (l) => (kind === 'all' || l.kind === kind) && (!query || l.raw.toLowerCase().includes(query))
  const visible = lines.filter(shown).length

  // Visible lines, with "n lines hidden" markers where the filter skips some.
  const rows = []
  let hidden = 0
  for (const l of lines) {
    if (!shown(l)) { hidden++; continue }
    if (hidden) rows.push({ gap: hidden, at: l.i })
    hidden = 0
    rows.push(l)
  }
  if (hidden && visible) rows.push({ gap: hidden, at: 'end' })

  function toggle(i) {
    if (done || sent.current) return
    if (pins.includes(i)) {
      setPins(pins.filter((p) => p !== i))
      setFull(false)
    } else if (pins.length >= maxPins) {
      setFull(true)
    } else {
      setPins([...pins, i].sort((a, b) => a - b))
      setFull(false)
    }
  }

  function accuse() {
    if (done || sent.current || chosen == null) return
    sent.current = true
    const score = (chosen === round.answer ? 0.6 : 0) + 0.4 * (found / round.clues.length)
    onResult(Math.round(score * 100) / 100)
  }

  function stateOf(l) {
    const pinned = pins.includes(l.i)
    if (!done) return pinned ? 'pinned' : ''
    if (pinned) return clueKeys.has(l.key) ? 'good' : 'herring'
    if (round.clues.includes(l.i)) return pinnedKeys.has(l.key) ? 'clue' : 'missed'
    return ''
  }

  const right = chosen === round.answer

  return (
    <div className="ar-log" ref={root}>
      <header className="ar-log-file">
        <div className="ar-log-file-top">
          <span>🕵️ Case file #{caseNo}</span>
          <span className="ar-log-conf">Confidential</span>
        </div>
        <p className="ar-log-brief">{round.q}</p>
      </header>

      <div className="ar-log-viewer" ref={viewer}>
        <div className="ar-log-bar">
          <div className="ar-log-search">
            <input
              type="search" value={done ? '' : search} onChange={(e) => setSearch(e.target.value)} disabled={done}
              placeholder="🔎 Search the log" aria-label="Search the log" spellCheck="false" autoComplete="off"
            />
            <span className="ar-log-count" aria-live="polite">{visible}/{lines.length} lines</span>
          </div>
          <div className="ar-log-chips" role="group" aria-label="Filter by event type">
            <button type="button" aria-pressed={kind === 'all'} onClick={() => setFilter('all')} disabled={done}>All</button>
            {KINDS.filter(([k]) => counts[k]).map(([k, label]) => (
              <button type="button" key={k} className={`k-${k}`} aria-pressed={kind === k} onClick={() => setFilter(kind === k ? 'all' : k)} disabled={done}>
                {label} <small>{counts[k]}</small>
              </button>
            ))}
          </div>
        </div>

        <ol className="ar-log-lines">
          {rows.map((r) => {
            if (r.gap) return <li key={`gap-${r.at}`} className="ar-log-gap" aria-hidden="true">⋯ {r.gap} {r.gap > 1 ? 'lines' : 'line'} hidden</li>
            const state = stateOf(r)
            const pinned = pins.includes(r.i)
            return (
              <li key={r.i} data-line={r.i}>
                <button
                  type="button" disabled={done} aria-pressed={pinned} onClick={() => toggle(r.i)}
                  className={`ar-log-row k-${r.kind}${r.head ? ' head' : ''}${state ? ` ${state}` : ''}`}
                  aria-label={`Line ${r.i + 1}${pinned ? ', pinned as evidence' : ''}: ${r.raw.trim() || 'empty'}`}
                >
                  <span className="ar-log-ln" aria-hidden="true">{r.i + 1}</span>
                  <span className="ar-log-txt" aria-hidden="true">
                    {TAGS[state] && <span className="ar-log-tag">{TAGS[state]}</span>}
                    {r.event ? (
                      <>
                        <span className="ar-log-time">{r.time}<span className="ar-log-nanos"> {r.nanos}</span></span>{' '}
                        <span className="ar-log-ev">{r.event}</span>
                        {r.rest && <> <Rest text={r.rest} /></>}
                      </>
                    ) : (
                      r.raw || ' '
                    )}
                  </span>
                </button>
              </li>
            )
          })}
          {!visible && (
            <li className="ar-log-none">
              No lines match. <button type="button" onClick={() => { setFilter('all'); setSearch('') }}>Clear the filter</button>
            </li>
          )}
        </ol>
      </div>

      <div className="ar-log-side">
        {!done && <p className="ar-help">👆 Tap the lines that prove it (up to {maxPins}), pick the culprit, then accuse.</p>}

        <section className="ar-log-bag" aria-label="Evidence">
          <div className="ar-log-bag-top">
            <span className="ar-log-h">🗂️ Evidence bag</span>
            <span className={`ar-log-bag-n${full ? ' full' : ''}`} aria-live="polite">
              {full ? `Full: unpin a line first (${pins.length}/${maxPins})` : done ? `${found} of ${round.clues.length} clues found` : `${pins.length}/${maxPins}`}
            </span>
          </div>
          {pins.length ? (
            <ul>
              {pins.map((p) => (
                <li key={p} className={done ? (clueKeys.has(lines[p].key) ? 'good' : 'herring') : ''}>
                  <code>L{p + 1}</code>
                  <span>{lines[p].event ? `${lines[p].event} ${lines[p].rest.replace(/\|/g, ' · ')}` : lines[p].raw.trim()}</span>
                  {!done && <button type="button" onClick={() => toggle(p)} aria-label={`Unpin line ${p + 1}`}>✕</button>}
                </li>
              ))}
            </ul>
          ) : (
            <p>{done ? 'No evidence pinned.' : 'Tap lines to bag them.'}</p>
          )}
        </section>

        <section className="ar-log-suspects" aria-label="Suspects">
          <span className="ar-log-h">🚨 Suspects</span>
          {round.suspects.map((s, i) => {
            const state = !done ? '' : i === round.answer ? ' right' : i === chosen ? ' wrong' : ' dim'
            return (
              <button type="button" key={s} className={`ar-log-suspect${state}`} aria-pressed={chosen === i} onClick={() => !done && setChosen(i)} disabled={done}>
                <b aria-hidden="true">{'ABCD'[i]}</b>
                <span>{s}</span>
              </button>
            )
          })}
        </section>

        {done ? (
          <div className="ar-log-verdict">
            <span className={`ar-log-stamp ${right ? 'good' : 'bad'}`}>{right ? 'Case closed' : 'Wrong suspect'}</span>
            <span>{right ? 'You named the culprit.' : `Culprit: ${'ABCD'[round.answer]}.`} Evidence {found}/{round.clues.length}.</span>
          </div>
        ) : (
          <div className="ar-log-accuse">
            <button type="button" className="btn btn-primary btn-sm" onClick={accuse} disabled={chosen == null}>
              ⚖️ Accuse{chosen != null ? ` suspect ${'ABCD'[chosen]}` : ''}
            </button>
            <span>{chosen == null ? 'Pick a suspect first.' : pins.length ? `${pins.length} line${pins.length > 1 ? 's' : ''} of evidence.` : 'No evidence pinned yet.'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
