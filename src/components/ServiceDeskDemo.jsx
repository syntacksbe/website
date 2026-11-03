import { useMemo, useRef, useState } from 'react'
import { useGame } from '../game.jsx'
import { HOUR, SHIFT, SKILLS, Shift, TOGGLES, baseline, clockAt, duration } from '../serviceDesk.js'
import Quest from './Quest.jsx'
import { Hud, LiveSwitches, Results, SetupCards, firstOff, useSim } from './SimParts.jsx'

const BRIEF =
  'It’s Monday morning and four agents face the weekend’s backlog. VIP customers expect an answer within the hour, everyone else within four. Set up the desk, then run the shift.'

const STEP = 0.2 // game seconds per 100 ms at 1×: a shift takes about 24 seconds
const SHOWN = 8 // cases visible in the queue
const HUMAN_ROUTER = 8 // manual assignments for the "Human router" badge

const level = (p) => (p < 0.5 ? 'ok' : p < 0.8 ? 'warn' : 'bad')
const stars = (n) => '★'.repeat(Math.round(n))

function stampFor(r) {
  if (r.breached === 0) return { label: 'Mission passed', tone: 'good' }
  if (r.sla >= 80) return { label: 'Almost there', tone: 'warn' }
  return { label: 'Wasted', tone: 'bad' }
}

// What the agent is doing on their current case.
function activity(c, setup) {
  if (c.wrong) return '🐢 Outside their skill'
  if (!setup.macros) return '⌨️ Typing a reply'
  return c.skill === 'tech' ? '📚 Article suggested' : '⚡ Macro applied'
}

export default function ServiceDeskDemo() {
  const { mark } = useGame()
  const [picked, setPicked] = useState(null) // case selected for manual assignment
  const assigned = useRef(0)
  const base = useMemo(() => baseline(), [])
  const game = useSim({
    toggles: TOGGLES,
    step: STEP,
    create: (setup) => new Shift(setup),
    onDone: (r) => {
      mark('sd-shift')
      if (r.breached === 0) mark('sd-zero')
      if (document.documentElement.dataset.theme === 'night') mark('sd-night')
    },
  })
  const { phase, setup, sim: s, result } = game

  function start() {
    assigned.current = 0
    setPicked(null)
    game.start()
  }

  // Without routing the player can help: pick a case, then a free agent (or tap a free agent
  // to hand them the case at the top of the queue).
  function assignTo(agent) {
    if (setup.routing || agent.case || s.done) return
    const caseId = picked ?? s.queue[0]?.id
    if (caseId == null || !s.assign(caseId, agent.id)) return
    setPicked(null)
    game.refresh()
    if (++assigned.current === HUMAN_ROUTER) mark('sd-human')
  }

  const live = s?.summary()
  const stage = phase === 'setup' ? 0 : phase === 'run' ? 1 : result.breached === 0 ? 3 : 2
  const hints = [
    'Switch on the automation you’d want, then start the shift. You can change it during the shift too.',
    setup.routing
      ? 'Omni-Channel is routing the cases. Flip a switch to see what changes.'
      : 'No routing: tap a case, then a free agent. Or flip a switch to automate it.',
    'Some customers waited too long. Tweak the setup and run it again.',
    'Zero breaches. That’s how I’d set up a service desk. 🏆',
  ]

  return (
    <div className="demo-panel sd">
      <Quest steps={['Set up the desk', 'Run the shift', 'Zero breaches']} current={stage} hint={hints[stage]} />

      {phase === 'setup' && (
        <>
          <p className="brief"><span>📋 Client brief</span>{BRIEF}</p>
          <SetupCards toggles={TOGGLES} setup={setup} onFlip={game.flip} />
          <button type="button" className="btn btn-primary run" onClick={start}>▶ Start the shift</button>
        </>
      )}

      {phase !== 'setup' && s && (
        <Hud
          clock={`🕘 ${clockAt(s.t)}`} t={s.t} total={SHIFT} switches={game.switches} toggles={TOGGLES}
          speed={game.speed} onSpeed={phase === 'run' ? game.toggleSpeed : null}
        >
          <span>SLA met <b>{live.arrived - live.breached}/{live.arrived}</b></span>
          <span className="sim-stat">CSAT <b>{live.handled ? live.csat.toFixed(1) : '–'}</b></span>
        </Hud>
      )}

      {phase === 'run' && s && (
        <>
          <LiveSwitches toggles={TOGGLES} setup={setup} onFlip={game.flip} />

          <div className="sd-floor">
            <div className="sd-queue">
              <p className="sim-label">Incoming queue · {s.queue.length}</p>
              <ol>
                {s.queue.slice(0, SHOWN).map((c) => {
                  const p = s.pressure(c)
                  const fresh = c.breached && s.t - c.breachedAt < 1.5
                  const Tag = setup.routing ? 'div' : 'button'
                  return (
                    <li key={c.id}>
                      <Tag
                        {...(setup.routing ? {} : { type: 'button', 'aria-pressed': picked === c.id, onClick: () => setPicked(picked === c.id ? null : c.id) })}
                        className={`sd-case${c.breached ? ' breached' : ''}${c.escalated ? ' escalated' : ''}`}
                      >
                        <span className="sd-case-top">
                          <span className={`sd-skill ${c.skill}`}>{SKILLS[c.skill].icon} {SKILLS[c.skill].label}</span>
                          {c.escalated && <span className="sd-flag">🚨 Escalated</span>}
                        </span>
                        <span className="sd-subject">{c.subject}</span>
                        {setup.sla ? (
                          <span className={`sd-sla ${c.breached ? 'bad' : level(p)}`}><i style={{ width: `${p * 100}%` }} /></span>
                        ) : (
                          <span className="sd-sla blind" title="No SLA clock">No SLA clock</span>
                        )}
                        {fresh && <span className="sd-wasted" aria-hidden="true">Wasted</span>}
                      </Tag>
                    </li>
                  )
                })}
                {s.queue.length > SHOWN && <li className="sd-more">+{s.queue.length - SHOWN} more waiting</li>}
                {!s.queue.length && <li className="sd-empty">Queue is empty ☕</li>}
              </ol>
            </div>

            <div className="sd-agents">
              {s.agents.map((a) => {
                const c = a.case
                const pop = a.last && s.t - a.last.at < 1.2
                const Tag = setup.routing ? 'div' : 'button'
                return (
                  <Tag
                    key={a.id}
                    {...(setup.routing ? {} : { type: 'button', onClick: () => assignTo(a), 'aria-label': `Assign to ${a.name}` })}
                    className={`sd-agent${c ? ' busy' : ''}${!setup.routing && !c ? ' open' : ''}`}
                  >
                    <span className="sd-agent-head">
                      <span className="sd-avatar" aria-hidden="true">{a.name[0]}</span>
                      <strong>{a.name}</strong>
                      <span className={`sd-skill ${a.skill}`}>{SKILLS[a.skill].icon} {SKILLS[a.skill].label}</span>
                    </span>
                    {c ? (
                      <>
                        <span className="sd-subject">{c.subject}</span>
                        <span className="sd-work"><i style={{ width: `${Math.min(1, (s.t - c.startAt) / c.work) * 100}%` }} /></span>
                        <small className={`sd-doing${c.wrong ? ' slow' : ''}`}>{activity(c, setup)}</small>
                      </>
                    ) : (
                      <small className="sd-idle">{setup.routing ? 'Free · waiting for a match' : picked != null ? 'Free · tap to assign' : 'Free · tap to give the next case'}</small>
                    )}
                    {pop && <span className={`sd-pop${a.last.stars < 3 ? ' low' : ''}`} key={a.last.at}>+{stars(a.last.stars)}</span>}
                  </Tag>
                )
              })}
            </div>
          </div>
        </>
      )}

      {phase === 'done' && result && (
        <Results
          stamp={stampFor(result)}
          caption="Your shift vs the same Monday with no automation"
          metrics={[
            { label: 'Cases handled', mine: `${result.handled}/${result.arrived}`, theirs: `${base.handled}/${base.arrived}`, better: result.handled > base.handled },
            { label: 'SLAs met', mine: `${result.sla}%`, theirs: `${base.sla}%`, better: result.sla > base.sla },
            { label: 'CSAT', mine: result.csat.toFixed(1), theirs: base.csat.toFixed(1), better: result.csat > base.csat },
            { label: 'Time to resolve', mine: duration(result.resolve), theirs: duration(base.resolve), better: result.resolve < base.resolve * 0.9 },
          ]}
          tip={result.breached === 0
            ? `${result.arrived} customers, ${Math.round(SHIFT / HOUR)} hours, not one late answer. This is the setup I build for service teams.`
            : (firstOff(TOGGLES, setup)?.tip ?? 'All four are on now, but they were off for part of the shift. Run it again with everything on from the start.')}
          switches={game.switches.length}
          onTweak={game.toSetup}
          onReplay={start}
        />
      )}
    </div>
  )
}
