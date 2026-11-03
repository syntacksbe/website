import { useEffect, useRef, useState } from 'react'
import { useContent, useLang } from '../i18n.jsx'
import { useMedia } from '../useMedia.js'
import SectionHead from './SectionHead.jsx'

// Experience as three game screens: a career stats panel that counts up, the industries as redacted case files
// (client names stay blacked out), and the .NET years as a finished prequel save that carries over into Salesforce.

const icons = {
  realEstate: <path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />,
  insurance: (
    <>
      <path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7l8-4z" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  mobility: (
    <>
      <path d="M5 16H3v-4l2-5h11l3 5h2v4h-2" />
      <path d="M9 16h6" />
      <circle cx="7" cy="16.5" r="2" />
      <circle cx="17" cy="16.5" r="2" />
    </>
  ),
}

// 0 → 1 over a second once the element scrolls into view; reduced motion starts at 1.
function useCountUp(ref, reduced) {
  const [p, setP] = useState(reduced ? 1 : 0)
  useEffect(() => {
    if (reduced || !('IntersectionObserver' in window)) return setP(1)
    let id = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      id = setInterval(() => {
        const t = Math.min(1, (performance.now() - start) / 1100)
        setP(1 - (1 - t) ** 3)
        if (t === 1) clearInterval(id)
      }, 30)
    }, { threshold: 0.4 })
    io.observe(ref.current)
    return () => {
      io.disconnect()
      clearInterval(id)
    }
  }, [ref, reduced])
  return p
}

export default function Experience() {
  const { t } = useLang()
  const { careerStats, carriedOver, dotnetStack, industries } = useContent()
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const statsRef = useRef(null)
  const p = useCountUp(statsRef, reduced)
  const [open, setOpen] = useState(0)
  const file = industries[open]
  const tabs = useRef(null)

  const onKey = (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!move) return
    e.preventDefault()
    const next = (open + move + industries.length) % industries.length
    setOpen(next)
    tabs.current.children[next].focus()
  }

  return (
    <section className="section section-alt" id="experience">
      <div className="container narrow">
        <SectionHead kicker={t('xp.kicker')} title={t('xp.title')}>
          {t('xp.sub')}
        </SectionHead>

        <div className="xp-stats reveal" ref={statsRef}>
          <p className="xp-stats-head"><span>{t('xp.stats')}</span><span>{t('xp.career')}</span></p>
          {careerStats.map((st, i) => (
            <div className="xp-stat" key={i} style={{ '--i': i }}>
              <b aria-hidden="true">{Math.round(st.value * p)}</b>
              <span aria-hidden="true">{st.label}</span>
              <span className="sr-only">{st.value} {st.label}</span>
              <i style={{ transform: `scaleX(${p})` }} />
            </div>
          ))}
        </div>

        <div className="xp-files reveal">
          <div className="xp-tabs" role="tablist" aria-label={t('xp.filesAria')} ref={tabs} onKeyDown={onKey}>
            {industries.map((ind, i) => (
              <button
                type="button"
                role="tab"
                key={ind.icon}
                id={`xp-tab-${i}`}
                aria-selected={i === open}
                aria-controls="xp-file"
                tabIndex={i === open ? 0 : -1}
                className="xp-tab"
                onClick={() => setOpen(i)}
              >
                <span className="icon"><svg viewBox="0 0 24 24" aria-hidden="true">{icons[ind.icon]}</svg></span>
                <span>
                  <small>{t('xp.caseFile', String(i + 1).padStart(3, '0'))}</small>
                  <strong>{ind.name}</strong>
                </span>
              </button>
            ))}
          </div>

          <article className="xp-file" role="tabpanel" id="xp-file" aria-labelledby={`xp-tab-${open}`} key={open}>
            <header className="xp-file-head">
              <p className="xp-file-meta">{t('xp.caseFile', String(open + 1).padStart(3, '0'))} · {file.name}</p>
              <p className="xp-client">
                {t('xp.client')} <span className="xp-redact" aria-hidden="true" /><span className="sr-only">{t('xp.withheld')}</span> {file.client}
              </p>
              {file.draft && <span className="xp-draft" title={t('xp.draftTitle')}>{t('xp.draft')}</span>}
              <span className="xp-stamp" aria-hidden="true">{t('xp.declassified')}</span>
            </header>
            <dl className="xp-facts">
              <div><dt>{t('xp.problem')}</dt><dd>{file.problem}</dd></div>
              <div><dt>{t('xp.built')}</dt><dd>{file.built}</dd></div>
              <div><dt>{t('xp.result')}</dt><dd>{file.result}</dd></div>
            </dl>
            <p className="xp-file-foot">{t('xp.foot')}</p>
          </article>
        </div>

        <article className="xp-save reveal">
          <p className="xp-save-top"><span>{t('xp.saveTop')}</span><span>{t('xp.saveYears')}</span></p>
          <div className="xp-save-bar" aria-hidden="true"><i /></div>
          <p className="kicker">{t('xp.before')}</p>
          <h3>{t('xp.beforeTitle')}</h3>
          <p>{t('xp.beforeText')}</p>
          <p className="xp-label">{t('xp.inventory')}</p>
          <ul className="xp-inv" aria-label={t('xp.invAria')}>
            {dotnetStack.map((tech) => <li key={tech}>{tech}</li>)}
          </ul>
          <p className="xp-trophy"><span aria-hidden="true">🏆</span> Microsoft Certified: MCSA Web Applications</p>
          <div className="xp-ng">
            <p><b>{t('xp.ng')}</b> {t('xp.carried')}</p>
            <ul>{carriedOver.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </article>
      </div>
    </section>
  )
}
