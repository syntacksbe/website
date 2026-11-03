import { useEffect, useRef, useState } from 'react'
import SectionHead from './SectionHead.jsx'
import { LINKEDIN_URL } from '../content.js'
import { healthCheck } from '../healthChecks.js'
import { useLang } from '../i18n.jsx'

// Answers are kept in this browser only, so a visitor can walk through Setup and come back later.
// They are stored by check id, so they survive a change of language.
const KEY = 'syntacks-health-check-v1'
const OPTIONS = ['yes', 'no', 'unsure']

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return saved && typeof saved.answers === 'object' ? saved : {}
  } catch {
    return {}
  }
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function HealthCheck() {
  const { lang, t } = useLang()
  const { AREAS, CHECKS, SEVERITY, evaluate } = healthCheck(lang)
  const [saved] = useState(load)
  const [answers, setAnswers] = useState(saved.answers || {})
  const [area, setArea] = useState(Math.min(saved.area || 0, AREAS.length - 1))
  const [done, setDone] = useState(Boolean(saved.done))
  const [saving, setSaving] = useState(false)
  const panel = useRef(null)
  const moved = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers, area, done }))
    } catch {
      // Private windows can refuse storage; the check still works, it just won't be remembered.
    }
  }, [answers, area, done])

  // Bring the top of the panel back into view when the step changes, not on the first render.
  useEffect(() => {
    if (!moved.current) {
      moved.current = true
      return
    }
    const top = panel.current?.getBoundingClientRect().top ?? 0
    if (top < 0) panel.current.scrollIntoView({ block: 'start' })
  }, [area, done])

  const answered = CHECKS.filter((c) => answers[c.id]).length
  const result = evaluate(answers)
  const current = AREAS[area]
  const last = area === AREAS.length - 1

  const answer = (id, v) => setAnswers((a) => ({ ...a, [id]: a[id] === v ? undefined : v }))
  const restart = () => {
    setAnswers({})
    setArea(0)
    setDone(false)
  }
  const download = async () => {
    setSaving(true)
    try {
      const { downloadReport } = await import('../healthReport.js')
      await downloadReport({ ...result, answers, linkedin: LINKEDIN_URL, lang })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="section" id="health-check">
      <div className="container">
        <SectionHead kicker={t('hc.kicker')} title={t('hc.title')}>
          {t('hc.sub', CHECKS.length)}
        </SectionHead>

        <div className="demo-panel hc reveal" ref={panel}>
          {!done ? (
            <>
              <nav className="hc-areas" aria-label={t('hc.areasAria')}>
                {AREAS.map((a, i) => {
                  const n = a.checks.filter((c) => answers[c.id]).length
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`hc-area${n === a.checks.length ? ' done' : ''}`}
                      aria-current={i === area ? 'step' : undefined}
                      onClick={() => setArea(i)}
                    >
                      <span className="hc-area-n">{n === a.checks.length ? '✓' : i + 1}</span>
                      <strong>{a.name}</strong>
                      <small>{n}/{a.checks.length}</small>
                    </button>
                  )
                })}
              </nav>

              <div className="hc-progress">
                <span>{t('hc.checked', answered, CHECKS.length)}</span>
                <div className="gauge-bar"><span style={{ width: `${(answered / CHECKS.length) * 100}%` }} /></div>
              </div>

              <header className="hc-area-head" key={current.id}>
                <p className="hc-topic">{t('hc.areaOf', area + 1, AREAS.length)}</p>
                <h3>{current.name}</h3>
                <p>{current.intro}</p>
              </header>

              <ol className="hc-checks" key={`list-${current.id}`}>
                {current.checks.map((c) => {
                  const a = answers[c.id]
                  return (
                    <li key={c.id} className={`hc-check${a ? ` is-${a}` : ''}`}>
                      <div className="hc-check-top">
                        <span className={`sev ${c.severity}`}>{SEVERITY[c.severity].label}</span>
                        <span className="hc-check-topic">{c.topic}</span>
                      </div>
                      <p className="hc-check-q">{c.check}</p>
                      <p className="hc-where">
                        <span>{t('hc.lookIn')}</span>
                        {c.where.map((w) => <code key={w}>{w}</code>)}
                      </p>
                      <p className="hc-why">{c.why}</p>
                      <div className="hc-opts" role="group" aria-label={c.topic}>
                        {[...OPTIONS.map((v) => ({ v, label: t(`hc.${v}`) })), ...(c.na ? [{ v: 'na', label: c.na }] : [])].map((o) => (
                          <button
                            type="button"
                            key={o.v}
                            className={`hc-opt ${o.v}`}
                            aria-pressed={a === o.v}
                            onClick={() => answer(c.id, o.v)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="hc-nav">
                {area > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={() => setArea(area - 1)}>
                    ← {AREAS[area - 1].name}
                  </button>
                )}
                {!last && (
                  <button type="button" className="btn btn-primary" onClick={() => setArea(area + 1)}>
                    {t('hc.next', AREAS[area + 1].name)}
                  </button>
                )}
                {(last || answered > 0) && (
                  <button
                    type="button"
                    className={`btn ${last ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setDone(true)}
                  >
                    {t('hc.seeReport')}
                  </button>
                )}
                {answered < CHECKS.length && (last || answered > 0) && (
                  <p className="hc-nav-note">
                    {t('hc.unanswered', CHECKS.length - answered)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <Result
              result={result}
              severity={SEVERITY}
              onEdit={() => setDone(false)}
              onRestart={restart}
              onDownload={download}
              saving={saving}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function Result({ result, severity: SEVERITY, onEdit, onRestart, onDownload, saving }) {
  const { t } = useLang()
  const { score, grade: g, areas, fixes } = result
  const count = (sev) => fixes.filter((f) => f.severity === sev).length

  return (
    <div className="hc-result" aria-live="polite">
      <div className="hc-result-top">
        <div className={`hc-score ${g.cls}`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={RADIUS} className="track" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              className="value"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
            />
          </svg>
          <div>
            <strong>{score}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div className="hc-summary">
          <p className={`hc-stamp ${g.cls}`}>{g.stamp}</p>
          <p className={`hc-grade ${g.cls}`}>{g.label}</p>
          <p>{g.text}</p>
          <ul className="hc-counts">
            {Object.keys(SEVERITY).map((sev) => (
              <li key={sev} className={sev}>
                <strong>{count(sev)}</strong> {SEVERITY[sev].label.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="hc-board" aria-label={t('hc.boardAria')}>
        {areas.map((a) => (
          <li key={a.id} className={a.cls}>
            <span>{a.name}</span>
            <strong>{a.score ?? '–'}</strong>
            <i><b style={{ width: `${a.score ?? 0}%` }} /></i>
            <small>{a.fixes ? t('hc.toFix', a.fixes) : t('hc.allClear')}</small>
          </li>
        ))}
      </ul>

      {fixes.length > 0 && (
        <div className="hc-fixes">
          <h4>{t('hc.start')}</h4>
          {Object.keys(SEVERITY).map((sev) => {
            const list = fixes.filter((f) => f.severity === sev)
            if (!list.length) return null
            return (
              <section key={sev} className={`hc-fixgroup ${sev}`}>
                <h5>{SEVERITY[sev].label} <span>{list.length}</span></h5>
                <ol>
                  {list.map((f) => (
                    <li key={f.id}>
                      <div className="hc-fix-head">
                        <strong>{f.topic}</strong>
                        <span className={`hc-tag ${f.status}`}>{f.status === 'fail' ? t('hc.failed') : t('hc.notChecked')}</span>
                        <small>{f.areaName}</small>
                      </div>
                      <p>
                        {f.status === 'unknown' && <><b>{t('hc.checkFirst')}</b>{t('hc.checkFirstIn', f.where.join(', '))}</>}
                        {f.fix}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </div>
      )}

      <div className="hc-cta">
        <p>{t('hc.cta')}</p>
        <div>
          <a href={LINKEDIN_URL} className="btn btn-primary" target="_blank" rel="noopener">
            {t('hc.contact')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={onDownload} disabled={saving}>
            {saving ? t('hc.printing') : t('hc.download')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            {t('hc.edit')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            {t('hc.restart')}
          </button>
        </div>
      </div>
    </div>
  )
}
