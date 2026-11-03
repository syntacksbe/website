import { useMemo } from 'react'
import { useGame } from '../game.jsx'
import { HEAT, QUARTER, QUOTA, Quarter, TOGGLES, baseline, euros, weekAt } from '../salesPipeline.js'
import Quest from './Quest.jsx'
import { Hud, LiveSwitches, Results, SetupCards, firstOff, useSim } from './SimParts.jsx'

const BRIEF =
  'Q3 starts today and a new campaign is pouring leads in. Three reps, a €850k quota, 13 weeks. Set up Sales Cloud, then run the quarter.'

const STEP = 0.11 // game seconds per 100 ms at 1×: a quarter takes about 24 seconds
const SHOWN = 6 // cards per column

const COLUMNS = [
  { id: 'lead', title: 'New leads' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'closed', title: 'Closed' },
]

const level = (p) => (p < 0.5 ? 'ok' : p < 0.8 ? 'warn' : 'bad')

function stampFor(r) {
  if (r.quota >= 100) return { label: 'Mission passed', tone: 'good' }
  if (r.quota >= 75) return { label: 'Almost there', tone: 'warn' }
  return { label: 'Wasted', tone: 'bad' }
}

function doing(d, setup) {
  if (d.stage === 'lead') return `📞 Calling ${d.company}`
  return setup.cpq ? `🧾 Quote from the price book` : `📊 Building a quote by hand`
}

function Deal({ d, q, setup, onClaim }) {
  const working = Boolean(d.rep)
  const waiting = (d.stage === 'lead' || d.stage === 'proposal') && !working
  const known = setup.scoring || d.stage !== 'lead' // the temperature shows once a rep has talked to them
  const fresh = d.closedAt != null && q.t - d.closedAt < 1.4
  const clickable = waiting && !setup.assign
  const Tag = clickable ? 'button' : 'div'
  const rep = working && q.reps.find((r) => r.id === d.rep)
  return (
    <Tag
      {...(clickable ? { type: 'button', onClick: () => onClaim(d.id), title: 'Hand to the first free rep' } : {})}
      className={`sp-deal ${d.stage}${d.whale ? ' whale' : ''}${fresh ? ' fresh' : ''}`}
    >
      <span className="sp-deal-top">
        <strong>{d.whale && '🐋 '}{d.company}</strong>
        <span className="sp-value">{euros(d.value)}</span>
      </span>
      <span className="sp-deal-meta">
        {d.stage === 'won' || d.stage === 'lost' || d.stage === 'nurture' ? (
          <span className="sp-reason">{d.stage === 'won' ? '🏆 ' : d.stage === 'nurture' ? '🌱 ' : '✖ '}{d.reason}</span>
        ) : known ? (
          <span className={`sp-heat ${d.heat}`}>{HEAT[d.heat].icon} {setup.scoring ? d.score : HEAT[d.heat].label}</span>
        ) : (
          <span className="sp-heat unknown">Score ?</span>
        )}
        {d.stage === 'negotiation' && <span className="sp-chance">{Math.round(d.chance * 100)}% chance</span>}
        {rep && <span className="sp-rep-tag">{rep.name}</span>}
      </span>
      {waiting && <span className={`sp-stale ${level(q.pressure(d))}`}><i style={{ width: `${q.pressure(d) * 100}%` }} /></span>}
      {working && <span className="sp-work"><i style={{ width: `${Math.min(1, (q.t - d.workStart) / d.work) * 100}%` }} /></span>}
      {fresh && d.stage === 'won' && <span className="sp-stamp" aria-hidden="true">+{euros(d.value)}</span>}
    </Tag>
  )
}

export default function SalesPipelineDemo() {
  const { mark } = useGame()
  const base = useMemo(() => baseline(), [])
  const game = useSim({
    toggles: TOGGLES,
    step: STEP,
    create: (setup) => new Quarter(setup),
    onDone: (r) => {
      mark('sc-quarter')
      if (r.quota >= 100) mark('sc-quota')
      if (r.lostToCompetitors === 0) mark('sc-speed')
      if (r.whale) mark('sc-whale')
    },
  })
  const { phase, setup, sim: q, result } = game

  function claim(id) {
    if (q.claim(id)) game.refresh()
  }

  const live = q?.summary()
  const stage = phase === 'setup' ? 0 : phase === 'run' ? 1 : result.quota >= 100 ? 3 : 2
  const hints = [
    'Switch on the Sales Cloud features you’d want, then start the quarter. You can change them mid-quarter too.',
    setup.assign
      ? 'Leads are assigned automatically. Flip a switch and watch the pipeline change.'
      : 'No assignment rules: tap a waiting card to hand it to a free rep, or flip a switch.',
    'The quarter closed below quota. Tweak the setup and run it again.',
    'Quota smashed. That’s how I’d set up Sales Cloud for a team like this. 🏆',
  ]

  const column = (id) => {
    if (id === 'closed') return q.deals.filter((d) => d.closedAt != null).sort((a, b) => b.closedAt - a.closedAt)
    return q.deals.filter((d) => d.stage === id).sort((a, b) => (b.rep ? 1 : 0) - (a.rep ? 1 : 0) || a.since - b.since)
  }

  return (
    <div className="demo-panel sp">
      <Quest steps={['Set up the team', 'Run the quarter', 'Hit quota']} current={stage} hint={hints[stage]} />

      {phase === 'setup' && (
        <>
          <p className="brief"><span>📋 Client brief</span>{BRIEF}</p>
          <SetupCards toggles={TOGGLES} setup={setup} onFlip={game.flip} />
          <button type="button" className="btn btn-primary run" onClick={game.start}>▶ Start the quarter</button>
        </>
      )}

      {phase !== 'setup' && q && (
        <Hud
          clock={`📅 Week ${weekAt(q.t)}`} t={q.t} total={QUARTER} switches={game.switches} toggles={TOGGLES}
          speed={game.speed} onSpeed={phase === 'run' ? game.toggleSpeed : null}
        >
          <span className="sp-quota" title={`${live.quota}% of quota`}>
            <span className="sp-quota-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, live.quota)}%` }} /></span>
            <b>{euros(live.booked)}</b> / {euros(QUOTA)}
          </span>
          <span className="sim-stat">Won <b>{live.won}</b></span>
        </Hud>
      )}

      {phase === 'run' && q && (
        <>
          <LiveSwitches toggles={TOGGLES} setup={setup} onFlip={game.flip} />

          <div className="sp-reps">
            {q.reps.map((r) => (
              <div className={`sp-rep${r.task ? ' busy' : ''}`} key={r.id}>
                <span className="sd-avatar" aria-hidden="true">{r.name[0]}</span>
                <span className="sp-rep-text">
                  <strong>{r.name}</strong>
                  <small>{r.task ? doing(r.task, setup) : setup.assign ? 'Free' : 'Free · looking at the list'}</small>
                </span>
              </div>
            ))}
          </div>

          <div className="sp-board">
            {COLUMNS.map((col) => {
              const cards = column(col.id)
              return (
                <div className={`sp-col ${col.id}`} key={col.id}>
                  <p className="sim-label">{col.title} · {col.id === 'closed' ? live.won + ' won' : cards.length}</p>
                  <ol>
                    {cards.slice(0, SHOWN).map((d) => (
                      <li key={d.id}><Deal d={d} q={q} setup={setup} onClaim={claim} /></li>
                    ))}
                    {cards.length > SHOWN && <li className="sd-more">+{cards.length - SHOWN} more</li>}
                    {!cards.length && <li className="sd-empty">—</li>}
                  </ol>
                </div>
              )
            })}
          </div>
        </>
      )}

      {phase === 'done' && result && (
        <Results
          stamp={stampFor(result)}
          caption="Your quarter vs the same quarter with no automation"
          metrics={[
            { label: 'Revenue booked', mine: euros(result.booked), theirs: euros(base.booked), better: result.booked > base.booked },
            { label: 'Quota', mine: `${result.quota}%`, theirs: `${base.quota}%`, better: result.quota > base.quota },
            { label: 'Deals won', mine: `${result.won}/${result.leads}`, theirs: `${base.won}/${base.leads}`, better: result.won > base.won },
            { label: 'Lost to competitors', mine: result.lostToCompetitors, theirs: base.lostToCompetitors, better: result.lostToCompetitors < base.lostToCompetitors },
          ]}
          tip={result.quota >= 100
            ? `${euros(result.booked)} booked, ${result.quota}% of quota${result.whale ? ', whale included 🐋' : ''}. This is the Sales Cloud setup I build for sales teams.`
            : (firstOff(TOGGLES, setup)?.tip ?? 'All four are on now, but they were off for part of the quarter. Run it again with everything on from week 1.')}
          switches={game.switches.length}
          onTweak={game.toSetup}
          onReplay={game.start}
        />
      )}
    </div>
  )
}
