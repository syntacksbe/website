import { useEffect, useRef, useState } from 'react'
import { useContent, useLang } from '../i18n.jsx'
import { useMedia } from '../useMedia.js'
import SectionHead from './SectionHead.jsx'
import Crew from '../gta/Crew.jsx'

// "How we'll work together" as a heist plan. Pick a mode (the two ways of working), then follow the route:
// four missions on a GPS line with a checkpoint between each, where the client decides before the next one.
// The briefing shows the mission's objective, the loot (what you get) and your part. Loading-screen tips rotate under it.
const TIP_EVERY = 5000

export default function Approach() {
  const { t } = useLang()
  const { plan, tips } = useContent()
  const [mode, setMode] = useState(0)
  const [step, setStep] = useState(0)
  const [tip, setTip] = useState(0)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const route = useRef(null)
  const { missions } = plan[mode]
  const m = missions[step]
  const last = step === missions.length - 1

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setTip((n) => (n + 1) % tips.length), TIP_EVERY)
    return () => clearInterval(id)
  }, [reduced, tips.length])

  const pickMode = (i) => {
    setMode(i)
    setStep(0)
  }

  const onKey = (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!move) return
    e.preventDefault()
    const next = (step + move + missions.length) % missions.length
    setStep(next)
    route.current.querySelectorAll('[role="tab"]')[next].focus()
  }

  return (
    <section className="section" id="approach">
      <div className="container">
        <SectionHead kicker={t('approach.kicker')} title={t('approach.title')}>
          {t('approach.sub')}
        </SectionHead>

        <div className="hp reveal">
          <div className="hp-modes" role="radiogroup" aria-label={t('approach.modesAria')}>
            {plan.map((p, i) => (
              <button type="button" role="radio" aria-checked={i === mode} key={p.id} className="hp-mode" onClick={() => pickMode(i)}>
                <small>{t('approach.mode', i + 1)}</small>
                <strong>{p.label}</strong>
                <span>{p.blurb}</span>
              </button>
            ))}
          </div>

          <div className="hp-board">
            <div className="hp-map">
              <p className="hp-head">
                <span>{t('approach.plan', plan[mode].label)}</span>
                <span>{last ? t('approach.finale') : t('approach.setupOf', step + 1, missions.length - 1)}</span>
              </p>

              <div className="hp-route" role="tablist" aria-label={t('approach.missionsAria')} ref={route} onKeyDown={onKey}
                style={{ '--s': step, '--n': missions.length }}>
                {missions.map((ms, i) => (
                  <button
                    type="button"
                    role="tab"
                    key={`${mode}-${ms.title}`}
                    id={`hp-tab-${i}`}
                    aria-selected={i === step}
                    aria-controls="hp-brief"
                    tabIndex={i === step ? 0 : -1}
                    className={`hp-wp${i < step ? ' done' : ''}`}
                    style={{ '--i': i }}
                    onClick={() => setStep(i)}
                  >
                    <span className="hp-pin" aria-hidden="true">{i === missions.length - 1 ? '🏁' : i + 1}</span>
                    <small>{i === missions.length - 1 ? t('approach.finale') : t('approach.setup', i + 1)}</small>
                    <strong>{ms.title}</strong>
                  </button>
                ))}
                {missions.slice(0, -1).map((ms, i) => (
                  <span key={`cp-${i}`} className={`hp-cp${i < step ? ' passed' : ''}`} style={{ '--i': i }} title={t('approach.checkpointTitle', ms.checkpoint)} aria-hidden="true" />
                ))}
                <i className="hp-blip" aria-hidden="true" />
              </div>
            </div>

            <div className="hp-brief" role="tabpanel" id="hp-brief" aria-labelledby={`hp-tab-${step}`} key={`${mode}-${step}`}>
              <div className="hp-objective">
                <p className="hp-label">{last ? t('approach.finale') : t('approach.setupMission', step + 1)} · {t('approach.objective')}</p>
                <h3>{m.title}</h3>
                <p>{m.objective}</p>
              </div>
              <div className="hp-lists">
                <div>
                  <p className="hp-label">{t('approach.loot')}</p>
                  <ul className="hp-loot">{m.loot.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
                <div>
                  <p className="hp-label">{t('approach.yourPart')}</p>
                  <ul className="hp-part">{m.yourPart.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              </div>
              <div className="hp-next">
                {m.checkpoint ? (
                  <p className="hp-check"><b>{t('approach.checkpoint')}</b> {m.checkpoint}</p>
                ) : (
                  <p className="hp-passed"><span>{t('approach.passed')}</span> {t('approach.passedText')}</p>
                )}
                {last ? (
                  <span className="hp-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>{t('approach.replay')}</button>
                    <a href="#contact" className="btn btn-primary btn-sm">{t('approach.planYours')}</a>
                  </span>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep(step + 1)}>{t('approach.next')}</button>
                )}
              </div>
            </div>
          </div>

          <p className="hp-tip">
            <b>{t('approach.tip')}</b>
            <span key={tip}>{tips[tip]}</span>
            <i className="hp-spinner" aria-hidden="true" />
          </p>
        </div>

        <Crew />
      </div>
    </section>
  )
}
