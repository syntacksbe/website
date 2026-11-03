import { useEffect, useRef, useState } from 'react'
import { highlight } from '../highlight.jsx'
import { useLang } from '../i18n.jsx'

// A looping mini-film for the hero: a customer buys a car at a dealer while Salesforce records,
// automation and integrations run in the background. Each step has a caption (story.steps in strings.<lang>.js),
// a line of code (always English) and (from step 1) the CRM record it produced: icon, object, and its text as a
// function of the language helpers.
const PRICE = 42900
const STEPS = [
  { ms: 2600, code: '// walk-in · Brussels Motors' },
  { ms: 3000, code: "insert new Account(Name='Sophie');", record: ['👤', 'Account', () => 'Sophie Martin'] },
  { ms: 3400, code: `insert new Opportunity(Amount=${PRICE});`, record: ['💼', 'Opportunity', ({ money }) => `Volta EV · ${money(PRICE)}`] },
  { ms: 2900, code: 'QuoteService.generatePdf(oppId);', record: ['📄', 'Quote', ({ t }) => t('story.recQuote')] },
  { ms: 2800, code: 'EventBus.publish(orderCreated);', record: ['📦', 'Order', () => 'ORD-1042'] },
  { ms: 2800, code: 'System.enqueueJob(new ErpSync(id));', record: ['🏭', 'ERP', ({ t }) => t('story.recErp')] },
  { ms: 3800, code: 'insert new ServiceAppointment(…);', record: ['🔧', 'Service', ({ t }) => t('story.recService')] },
]

// Where Sophie stands during each step (x in scene units).
const CLIENT_X = [330, 330, 252, 330, 330, 330, 210]
const WALK_MS = 1700
const PAINT = ['#2b2f36', '#ffb21a', '#f8fafc', '#0f8b8d']
const CONFETTI_COLORS = ['#ff5a1f', '#ffb21a', '#22c55e', '#f59e0b', '#e5484d', '#0f7b7b']

export default function DealershipStory() {
  const lang = useLang()
  const { t, money } = lang
  const labels = t('story.steps')
  const [still] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [step, setStep] = useState(still ? STEPS.length - 1 : 0)
  const [loop, setLoop] = useState(0) // remounts the scene so every loop starts clean
  const [cx, setCx] = useState(still ? CLIENT_X[3] : -50)
  const [walking, setWalking] = useState(false)
  const [visible, setVisible] = useState(true)
  const ref = useRef(null)
  const cxRef = useRef(cx)

  // Only play while the hero is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  // Advance through the story, then start over.
  useEffect(() => {
    if (still || !visible) return
    const t = setTimeout(() => {
      if (step === STEPS.length - 1) {
        setLoop((l) => l + 1)
        setStep(0)
      } else {
        setStep(step + 1)
      }
    }, STEPS[step].ms)
    return () => clearTimeout(t)
  }, [step, visible, still])

  // Walk Sophie to where the current step happens.
  useEffect(() => {
    if (still) return
    const timers = []
    const moveTo = (x) => {
      if (x === cxRef.current) return
      cxRef.current = x
      setCx(x)
      setWalking(true)
      timers.push(setTimeout(() => setWalking(false), WALK_MS))
    }
    if (step === 0) {
      cxRef.current = -50
      setCx(-50)
      timers.push(setTimeout(() => moveTo(CLIENT_X[0]), 80))
    } else {
      moveTo(CLIENT_X[step])
    }
    return () => timers.forEach(clearTimeout)
  }, [step, loop, still])

  const typing = step === 1 || step === 3
  const records = STEPS.slice(1, step + 1).map((s) => s.record)
  const code = STEPS.slice(0, step + 1).slice(-5)

  return (
    <div ref={ref} className={`story${still ? ' still' : ''}`} data-step={step} aria-hidden="true">
      <div className="story-stage" key={loop}>
        <svg className="story-svg" viewBox="0 0 560 300">
          <defs>
            <linearGradient id="st-spot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* sunset seen through the showroom windows */}
            <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd23f" />
              <stop offset=".55" stopColor="#ff7a33" />
              <stop offset="1" stopColor="#b8401a" />
            </linearGradient>
            <clipPath id="st-windows">
              {[24, 100, 176].map((x) => <rect key={x} x={x} y="54" width="64" height="128" rx="6" />)}
            </clipPath>
            <filter id="st-neon" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* showroom: windows onto a sunset with palms */}
          <rect className="st-wall" width="560" height="232" />
          <g clipPath="url(#st-windows)">
            <rect x="24" y="54" width="216" height="128" fill="url(#st-sky)" />
            <circle cx="150" cy="150" r="30" fill="#ffe08a" opacity=".85" />
            <path className="st-skyline" d="M24 182v-26h14v-12h10v18h12v-30h16v30h10v-14h18v34h10v-22h14v22h22v-28h12v28h16v-18h20v18h18v-34h14v34h10z" />
            <path className="st-palm-sil" d="M60 182c-1-28-3-46 4-66m0 0c-9-8-20-8-30 0 10-5 20-4 30 0zm0 0c-6-12-15-18-26-18 11 4 19 9 26 18zm0 0c1-12 6-20 16-23-8 7-12 14-16 23zm0 0c9-7 18-7 24-1-8-3-16-2-24 1z" />
            <path className="st-palm-sil" d="M212 182c1-24 3-40-3-58m0 0c8-7 18-7 27 0-9-4-18-3-27 0zm0 0c5-10 13-16 23-16-10 4-17 8-23 16zm0 0c-1-11-5-18-14-21 7 6 11 13 14 21zm0 0c-8-6-16-6-22-1 7-3 15-2 22 1z" />
          </g>
          {[24, 100, 176].map((x) => <rect key={x} className="st-window" x={x} y="54" width="64" height="128" rx="6" />)}
          <rect className="st-sign" x="190" y="14" width="180" height="28" rx="6" />
          <text className="st-sign-text" x="280" y="33" textAnchor="middle" filter="url(#st-neon)">BRUSSELS MOTORS</text>
          <polygon className={`st-spot${step === 2 ? ' on' : ''}`} points="152,0 70,240 236,240" fill="url(#st-spot)" />
          <rect className="st-floor" y="232" width="560" height="68" />
          <ellipse className="st-platform" cx="152" cy="247" rx="112" ry="11" />

          {/* factory / ERP bubble */}
          <g className={`st-factory${step === 5 ? ' on' : ''}`}>
            <circle className="st-bubble" cx="505" cy="64" r="34" />
            <path className="st-building" d="M482 82V62l12 8v-8l12 8v-8l12 8v12z" />
            <rect className="st-building" x="510" y="46" width="6" height="18" rx="1" />
            <circle className="smoke s1" cx="513" cy="40" r="4" />
            <circle className="smoke s2" cx="517" cy="32" r="5" />
            <text className="st-label" x="505" y="112" textAnchor="middle">{t('story.factory')}</text>
          </g>
          {step === 5 && [0, 1, 2].map((i) => <circle key={i} className="packet" cx="430" cy="176" r="4.5" style={{ '--d': `${i * 0.35}s` }} />)}

          {/* the car: a regular modern sedan facing right (trunk left, hood right) */}
          <g className={`car${step === 6 ? ' drive' : ''}`}>
            <g transform="translate(67 186)">
              <path className="car-shadow" d="M10 64h158" />
              <path className="car-flame" d="M4 40q-16 2-26 0 10-5 26-7z" />
              <path
                className={`car-body${step === 2 ? ' painting' : ''}`}
                fill={step > 2 ? PAINT[3] : PAINT[0]}
                d="M4 48V36q0-6 6-7l30-2 16-15q3-3 9-3h47q6 0 10 4l14 14 26 3q10 2 10 10v8q0 4-5 4h-13a16 16 0 0 0-32 0H56a16 16 0 0 0-32 0H9q-5 0-5-4z"
              />
              <path className="car-glass" d="M45 27l13-13q2-2 6-2h22v15zM90 12h20q5 0 8 3l12 12H90z" />
              <path className="car-line" d="M88 27v19M100 32h7" />
              <rect className="car-light" x="164" y="33" width="8" height="4" rx="1.5" />
              <rect className="car-tail" x="4" y="32" width="5" height="4" rx="1.5" />
              {[40, 138].map((x) => (
                <g key={x} className="wheel">
                  <circle cx={x} cy="52" r="12" className="tyre" />
                  <g className="spokes">
                    <circle cx={x} cy="52" r="7" className="rim" />
                    {[0, 72, 144, 216, 288].map((a) => (
                      <line key={a} x1={x} y1="52" x2={x + 6 * Math.cos((a * Math.PI) / 180)} y2={52 + 6 * Math.sin((a * Math.PI) / 180)} className="spoke" />
                    ))}
                  </g>
                </g>
              ))}
            </g>
            <path className="speed" d="M40 210h-30M48 222h-40M40 234h-24" />
          </g>

          {/* sales desk + Lucas */}
          <circle className="st-skin" cx="478" cy="150" r="13" />
          <path className="st-hair" d="M465 148q1-14 13-14t13 14q-5-8-13-8t-13 8z" />
          <rect className="st-staff" x="458" y="165" width="40" height="48" rx="14" />
          <rect className={`arm${typing ? ' typing' : ''}`} x="440" y="194" width="26" height="7" rx="3.5" />
          <rect className="st-desk" x="352" y="208" width="152" height="10" rx="4" />
          <rect className="st-desk-front" x="360" y="218" width="136" height="36" rx="4" />
          <rect className="st-laptop" x="402" y="202" width="56" height="6" rx="2" />
          <rect className="st-screen" x="408" y="168" width="44" height="34" rx="4" />
          {[0, 1, 2].map((i) => (
            <rect key={i} className={`screen-line${typing || step >= 4 ? ' live' : ''}`} x="414" y={177 + i * 8} width={[30, 22, 26][i]} height="3" rx="1.5" style={{ '--d': `${i * 0.2}s` }} />
          ))}

          {/* Sophie */}
          <g className="client-wrap">
            <g
              className={`client${walking ? ' walking' : ''}`}
              style={{ transform: `translate(${cx}px, 258px)`, transitionDuration: cx < 0 ? '0s' : undefined }}
            >
              <rect className="leg leg-a" x="-10" y="-34" width="8" height="34" rx="4" />
              <rect className="leg leg-b" x="2" y="-34" width="8" height="34" rx="4" />
              <rect className="st-client" x="-16" y="-80" width="32" height="50" rx="14" />
              <circle className="st-skin-2" cx="0" cy="-92" r="12" />
              <path className="st-hair-2" d="M-13-90q-1-17 13-17t13 17q-4-10-13-10t-13 10z" />
            </g>
          </g>
        </svg>

        <p className="story-caption" key={`c${step}`}>
          <b>{step + 1}/{STEPS.length}</b> {labels[step]}
        </p>

        {step === 1 && (
          <div className="story-pop pop-form">
            <strong>{t('story.newCustomer')}</strong>
            {[[t('story.name'), 'Sophie Martin'], [t('story.email'), 'sophie@martin.be'], [t('story.phone'), '+32 470 12 34 56']].map(([k, v], i) => (
              <p key={k}><small>{k}</small><span className="type" style={{ '--d': `${0.3 + i * 0.7}s` }}>{v}</span></p>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="story-pop pop-paint">
            <strong>Volta EV</strong>
            <div className="swatches">
              {PAINT.map((c, i) => <i key={c} style={{ background: c, '--d': `${i * 0.7}s` }} className={i === 3 ? 'final' : ''} />)}
            </div>
            <small>{money(PRICE)} · {t('story.leaseOrBuy')}</small>
          </div>
        )}
        {step === 3 && (
          <div className="story-pop pop-quote">
            <strong>{t('story.quote')}</strong>
            <span className="doc-line" /><span className="doc-line short" /><span className="doc-line" />
            <svg viewBox="0 0 120 36" className="signature"><path d="M4 26c10-18 16-18 14-4s8-14 14-10-4 16 4 12 10-14 16-10 2 12 10 8 12-10 22-8 18 2 28 0" /></svg>
            <em>{t('story.signed')}</em>
          </div>
        )}
        {step === 4 && (
          <div className="story-won">
            🎉 Closed Won
            <span className="confetti">
              {Array.from({ length: 22 }, (_, i) => {
                const a = (i / 22) * Math.PI * 2
                const d = 70 + (i % 3) * 30
                return <i key={i} style={{ '--x': `${Math.cos(a) * d}px`, '--y': `${Math.sin(a) * d - 30}px`, '--r': `${i * 41}deg`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }} />
              })}
            </span>
          </div>
        )}
        {step === 5 && <div className="story-pop pop-erp">201 Created</div>}
        {step === 6 && <div className="story-pop pop-keys">{t('story.keys')}</div>}
      </div>

      <div className="story-panels">
        <div className="code-card story-code">
          <div className="code-head"><span /><span /><span /><p>{t('story.running')}</p></div>
          <pre>
            {code.map((s, i) => (
              <code key={s.code} className={i === code.length - 1 ? 'now' : 'past'}>
                <b>{i === code.length - 1 ? '▶' : '✓'}</b>{highlight(s.code)}
              </code>
            ))}
          </pre>
        </div>
        <div className="story-crm">
          <p className="story-crm-head"><strong>Salesforce</strong><small>{t('story.records', records.length)}</small></p>
          <ul>
            {records.map(([icon, type, text], i) => (
              <li key={type} className={i === records.length - 1 ? 'new' : ''}>
                <span>{icon}</span>
                <b>{type}</b>
                <small>{text(lang)}</small>
              </li>
            ))}
            {records.length === 0 && <li className="empty">{t('story.waiting')}</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
