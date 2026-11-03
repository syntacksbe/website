import DealershipStory from './DealershipStory.jsx'
import Words from './Words.jsx'
import { useLang } from '../i18n.jsx'

// Palm silhouette for the sunset backdrop; the fronds sway (see .palm .fronds).
function Palm({ className }) {
  return (
    <svg className={`palm ${className}`} viewBox="0 0 200 400" aria-hidden="true">
      <path d="M104 400c-4-100-8-180 8-260" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      <g className="fronds" fill="currentColor">
        <path d="M112 140c-32-30-72-30-104 0 37-20 72-15 104 0z" />
        <path d="M112 140c-22-45-52-70-92-70 40 15 68 35 92 70z" />
        <path d="M112 140c3-45 23-75 58-85-30 25-45 50-58 85z" />
        <path d="M112 140c33-25 63-25 86-5-28-10-58-7-86 5z" />
        <path d="M112 140c18 10 38 35 48 65-20-25-35-43-48-65z" />
        <path d="M112 140c-17 10-37 35-50 60 18-25 36-40 50-60z" />
      </g>
    </svg>
  )
}

export default function Hero() {
  const { t } = useLang()
  const first = t('hero.title1')
  return (
    <section className="hero">
      <div className="hero-sun" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-grid-bg" aria-hidden="true" />
      <Palm className="left" />
      <Palm className="right" />
      <div className="container hero-stack">
        <h1>
          <Words text={first} />{' '}
          <Words text={t('hero.title2')} start={first.split(' ').length} className="gradient-text" />
        </h1>
        <div className="hero-actions hero-in" style={{ '--d': 4 }}>
          <a href="#contact" className="btn btn-primary">
            {t('hero.cta')}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <a href="arcade/" className="btn btn-ghost" aria-label={t('hero.arcade')}>
            <span aria-hidden="true">🎮</span> <span className="long" aria-hidden="true">{t('hero.arcade')}</span><span className="short" aria-hidden="true">{t('hero.arcadeShort')}</span>
          </a>
        </div>

        <div className="hero-visual hero-in" style={{ '--d': 6 }}>
          <DealershipStory />
        </div>
      </div>
      <a href="#services" className="scroll-cue" aria-label={t('hero.scroll')}><span /></a>
    </section>
  )
}
