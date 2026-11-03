import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game.jsx'
import Quest from './Quest.jsx'

const BRIEF =
  'Sync every new Order from Salesforce to SAP in near real time. SAP is down for maintenance every night, and peak days bring 20,000 orders.'

// The three design decisions. Each option id is used by the stress tests below.
const CHOICES = [
  {
    id: 'trigger',
    label: 'How does the sync start?',
    options: [
      { id: 'apex', label: 'Apex trigger callout' },
      { id: 'event', label: 'Platform Event' },
      { id: 'cdc', label: 'Change Data Capture' },
      { id: 'batch', label: 'Nightly batch' },
    ],
  },
  {
    id: 'delivery',
    label: 'What if SAP doesn’t answer?',
    options: [
      { id: 'fire', label: 'Send once' },
      { id: 'retry', label: 'Retry a few times' },
      { id: 'dlq', label: 'Retry + dead-letter queue' },
    ],
  },
  {
    id: 'matching',
    label: 'How is the order written in SAP?',
    options: [
      { id: 'insert', label: 'Insert' },
      { id: 'upsert', label: 'Upsert on External ID' },
    ],
  },
]

// Each test returns [passed, reason] for a design.
const TESTS = [
  {
    id: 'peak',
    icon: '⚡',
    title: '20,000-order peak',
    run: (d) => {
      if (d.trigger === 'apex') return [false, 'Triggers can’t make synchronous callouts — and 20,000 orders would blow the 100-callout limit.']
      if (d.trigger === 'batch') return [true, 'Batches of 200 handle the volume easily.']
      return [true, 'Events are published in bulk and processed asynchronously — no limits hit.']
    },
  },
  {
    id: 'outage',
    icon: '🌙',
    title: '2-hour SAP outage',
    run: (d) => {
      if (d.trigger === 'batch') return [false, 'The batch runs at night — exactly when SAP is down for maintenance.']
      if (d.trigger === 'apex') return [false, 'No queue: orders created during the outage simply fail.']
      if (d.delivery === 'fire') return [false, 'Orders sent during the outage are lost for good.']
      if (d.delivery === 'retry') return [false, 'Retries give up after a few minutes — a 2-hour outage still loses orders.']
      return [true, 'Failed orders wait in the dead-letter queue and are replayed when SAP is back.']
    },
  },
  {
    id: 'duplicate',
    icon: '🔁',
    title: 'Same message twice',
    run: (d) =>
      d.matching === 'upsert'
        ? [true, 'Upsert on the External ID makes a redelivered message harmless.']
        : [false, 'Insert creates a second order in SAP — finance will notice.'],
  },
]

const MY_DESIGN = 'Platform Event → retry + dead-letter queue → upsert on External ID'

const HINTS = [
  'Read the brief, then pick one option for each question.',
  'Run the stress test to see if your design survives.',
  'Not quite — change your design and run it again.',
  'That’s exactly how I’d build it. 🏆',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function IntegrationDemo() {
  const game = useGame()
  const [design, setDesign] = useState({})
  const [results, setResults] = useState([]) // [passed, reason] per finished test
  const [runningIndex, setRunningIndex] = useState(null)
  const run = useRef(0)
  const testsRef = useRef(null)

  // Bumping the run id makes an in-flight test run stop at its next await.
  useEffect(() => () => { run.current++ }, [])

  const complete = CHOICES.every((c) => design[c.id])
  const finished = results.length === TESTS.length
  const stars = results.filter(([passed]) => passed).length
  const stage = !complete ? 0 : !finished ? 1 : stars < TESTS.length ? 2 : 3

  function choose(group, option) {
    if (runningIndex !== null) return
    setDesign({ ...design, [group]: option })
    setResults([])
  }

  async function stressTest() {
    const id = ++run.current
    setResults([])
    // On phones the results sit below the choices — bring them into view (desktop shows them side by side).
    const box = testsRef.current?.getBoundingClientRect()
    if (box && box.bottom > window.innerHeight) testsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const done = []
    for (let i = 0; i < TESTS.length; i++) {
      setRunningIndex(i)
      await sleep(900)
      if (run.current !== id) return
      done.push(TESTS[i].run(design))
      setResults([...done])
    }
    setRunningIndex(null)

    game.mark('int-test')
    if (done[1][0]) game.mark('int-outage')
    if (done.every(([passed]) => passed)) game.mark('int-stars')
  }

  return (
    <div className="demo-panel arch">
      <Quest steps={['Design', 'Stress test', '3 stars']} current={stage} hint={HINTS[stage]} />

      <p className="brief"><span>📋 Client brief</span>{BRIEF}</p>

      <div className="arch-grid">
        <div className="arch-choices">
          {CHOICES.map((c, i) => (
            <div className="choice" key={c.id} role="radiogroup" aria-label={c.label}>
              <p><b>{i + 1}</b> {c.label}</p>
              <div className="chips">
                {c.options.map((o) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={design[c.id] === o.id}
                    key={o.id}
                    className="chip"
                    onClick={() => choose(c.id, o.id)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-primary run" onClick={stressTest} disabled={!complete || runningIndex !== null}>
            {runningIndex !== null ? 'Testing…' : finished ? 'Run the stress test again' : 'Run the stress test'}
          </button>
        </div>

        <div className="arch-tests" aria-live="polite" ref={testsRef}>
          {TESTS.map((t, i) => {
            const result = results[i]
            const state = result ? (result[0] ? 'pass' : 'fail') : runningIndex === i ? 'running' : ''
            return (
              <div className={`test ${state}`} key={t.id}>
                <span className="test-icon" aria-hidden="true">{result ? (result[0] ? '✅' : '❌') : t.icon}</span>
                <div>
                  <strong>{t.title}</strong>
                  <small>{result ? result[1] : runningIndex === i ? 'Testing…' : 'Waiting for your design'}</small>
                </div>
                {state === 'running' && <span className="test-bar" aria-hidden="true" />}
              </div>
            )
          })}

          {finished && (
            <div className={`stars-box${stars === TESTS.length ? ' perfect' : ''}`}>
              <span className="stars" aria-label={`${stars} of 3 stars`}>
                {[0, 1, 2].map((i) => <i key={i} className={i < stars ? 'on' : ''} style={{ '--i': i }}>★</i>)}
              </span>
              <small>{stars === TESTS.length ? 'Production-ready design.' : `My design: ${MY_DESIGN}`}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
