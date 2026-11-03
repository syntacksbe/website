import { useEffect, useState } from 'react'
import { useLang } from '../i18n.jsx'

const SEEN_KEY = 'syntacks-intro-seen'
const DURATION = 2000
// The tips (intro.tips) and panel captions (intro.panels) are in strings.<lang>.js.

// Shown on the very first visit only (or with ?intro in the URL), never for reduced motion.
function shouldShow() {
  if (new URLSearchParams(window.location.search).has('intro')) return true
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !localStorage.getItem(SEEN_KEY)
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Without storage the intro may show again next visit; harmless.
  }
}

// Comic panels for the loading screen; simple original line art.
function PanelArt({ kind }) {
  if (kind === 'code') {
    return (
      <svg viewBox="0 0 120 90" aria-hidden="true">
        <path d="M38 14c-12 0-12 8-12 16s-2 14-10 15c8 1 10 7 10 15s0 16 12 16" />
        <path d="M82 14c12 0 12 8 12 16s2 14 10 15c-8 1-10 7-10 15s0 16-12 16" />
        <path className="ink-accent" d="M48 34h24M48 46h16M48 58h20" />
      </svg>
    )
  }
  if (kind === 'flow') {
    return (
      <svg viewBox="0 0 120 90" aria-hidden="true">
        <circle cx="60" cy="14" r="8" />
        <path d="M60 22v10" />
        <path className="ink-accent" d="M60 32l16 13-16 13-16-13z" />
        <path d="M44 45H24v22M76 45h20v22" />
        <rect x="12" y="67" width="24" height="14" rx="3" />
        <rect x="84" y="67" width="24" height="14" rx="3" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <path d="M14 62h92M22 62c0-8 4-12 12-14l12-12h30l14 12c10 1 16 5 16 14" />
      <circle cx="38" cy="64" r="8" />
      <circle cx="86" cy="64" r="8" />
      <path className="ink-accent" d="M2 40h12M0 50h16M6 30h10" />
    </svg>
  )
}

const PANELS = ['code', 'flow', 'car']

export default function LoadingScreen() {
  const { t } = useLang()
  const tips = t('intro.tips')
  const captions = t('intro.panels')
  const [show, setShow] = useState(shouldShow)
  const [leaving, setLeaving] = useState(false)
  const [tip] = useState(() => Math.floor(Math.random() * tips.length))

  useEffect(() => {
    if (!show) return
    markSeen()
    document.documentElement.classList.add('intro-open')
    const done = setTimeout(() => setLeaving(true), DURATION)
    const onKey = (e) => e.key === 'Escape' && setLeaving(true)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(done)
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('intro-open')
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className={`intro${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-label={t('intro.aria')}
      onAnimationEnd={(e) => e.target === e.currentTarget && leaving && setShow(false)}
    >
      <div className="intro-panels">
        {PANELS.map((kind, i) => (
          <figure className="intro-panel" key={kind} style={{ '--i': i }}>
            <PanelArt kind={kind} />
            <figcaption>{captions[i]}</figcaption>
          </figure>
        ))}
      </div>
      <h2 className="intro-title">Syntacks</h2>
      <p className="intro-tip"><b>{t('intro.tip')}</b> {tips[tip]}</p>
      <div className="intro-bar" aria-hidden="true"><span style={{ animationDuration: `${DURATION}ms` }} /></div>
      <button type="button" className="intro-skip" onClick={() => setLeaving(true)} autoFocus>
        {t('intro.skip')}
      </button>
    </div>
  )
}
