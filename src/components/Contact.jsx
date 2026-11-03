import { useEffect, useRef, useState } from 'react'
import { LINKEDIN_URL } from '../content.js'
import { useLang } from '../i18n.jsx'
import './contact.css'

const TEXTS = {
  en: {
    title: 'Have a Salesforce project in mind?',
    intro:
      "Whether you need an extra developer on your team or someone to own a technical challenge from start to finish — let's talk about it.",
    linkedin: 'Message me on LinkedIn',
    or: 'Or drop a message on the phone.',
    carrier: 'SYNTACKS',
    notifApp: 'Messages',
    notifFrom: 'Marc',
    tapHint: 'Tap Messages to reply',
    apps: { messages: 'Messages', arcade: 'Arcade', health: 'Health check', trophies: 'Trophies', linkedin: 'LinkedIn', services: 'Services' },
    back: 'Back to the home screen',
    sentToast: 'Text message sent',
    sentTo: 'To: Marc',
    now: 'now',
    newMessage: '1 new message',
    contact: 'Marc',
    contactSub: 'Salesforce consultant · Brussels',
    hello: "Hi! Tell me what you're working on and I'll get back to you.",
    name: 'Your name',
    namePh: 'Alex Janssens',
    company: 'Company',
    companyPh: 'Optional',
    need: 'What do you need?',
    needs: ['Custom development', 'Integration', 'Org health check', 'Service Cloud', 'Data & migration', 'Something else'],
    timeline: 'Timeline',
    timelines: ['ASAP', 'This quarter', 'Later'],
    message: 'Message',
    messagePh: 'A line or two about the project…',
    send: 'Send',
    required: 'required',
    errors: {
      name: 'What should I call you?',
      need: 'Pick at least one, even if it is "Something else".',
      message: 'Add a line or two so I know where to start.',
    },
    summary: ({ name, company, need, timeline }) =>
      [`${name}${company ? `, ${company}` : ''}`, need.join(' · '), timeline].filter(Boolean).join(' — '),
    sending: 'Sending…',
    delivered: 'Delivered',
    typing: 'Marc is typing',
    passed: 'Mission passed',
    passedSub: 'Message delivered',
    thanks: "Thanks — I'll get back to you soon.",
    faster: 'Faster: message me on LinkedIn.',
    again: 'Send another',
    },
  nl: {
    title: 'Een Salesforce-project in gedachten?',
    intro: 'Of je nu een extra developer in je team zoekt of iemand die een technische uitdaging van begin tot eind draagt — laten we erover praten.',
    linkedin: 'Stuur me een bericht op LinkedIn',
    or: 'Of stuur een berichtje via de gsm.',
    carrier: 'SYNTACKS',
    notifApp: 'Berichten',
    notifFrom: 'Marc',
    tapHint: 'Tik op Berichten om te antwoorden',
    apps: { messages: 'Berichten', arcade: 'Arcade', health: 'Org-check', trophies: 'Trofeeën', linkedin: 'LinkedIn', services: 'Diensten' },
    back: 'Terug naar het startscherm',
    sentToast: 'Bericht verstuurd',
    sentTo: 'Aan: Marc',
    now: 'nu',
    newMessage: '1 nieuw bericht',
    contact: 'Marc',
    contactSub: 'Salesforce-consultant · Brussel',
    hello: 'Hoi! Vertel me waar je aan werkt, dan kom ik bij je terug.',
    name: 'Je naam',
    namePh: 'Alex Janssens',
    company: 'Bedrijf',
    companyPh: 'Optioneel',
    need: 'Wat heb je nodig?',
    needs: ['Maatwerk', 'Integratie', 'Org health check', 'Service Cloud', 'Data & migratie', 'Iets anders'],
    timeline: 'Timing',
    timelines: ['Zo snel mogelijk', 'Dit kwartaal', 'Later'],
    message: 'Bericht',
    messagePh: 'Een paar regels over het project…',
    send: 'Verstuur',
    required: 'verplicht',
    errors: {
      name: 'Hoe mag ik je noemen?',
      need: 'Kies er minstens één, ook al is het "Iets anders".',
      message: 'Schrijf een paar regels, zodat ik weet waar te beginnen.',
    },
    summary: ({ name, company, need, timeline }) =>
      [`${name}${company ? `, ${company}` : ''}`, need.join(' · '), timeline].filter(Boolean).join(' — '),
    sending: 'Versturen…',
    delivered: 'Afgeleverd',
    typing: 'Marc is aan het typen',
    passed: 'Missie geslaagd',
    passedSub: 'Bericht afgeleverd',
    thanks: 'Bedankt — ik kom snel bij je terug.',
    faster: 'Sneller: stuur me een bericht op LinkedIn.',
    again: 'Nog een sturen',
  },
  fr: {
    title: 'Un projet Salesforce en tête\u202f?',
    intro: 'Que vous ayez besoin d’un développeur en renfort ou de quelqu’un qui porte un défi technique de bout en bout — parlons-en.',
    linkedin: 'Écrivez-moi sur LinkedIn',
    or: 'Ou envoyez un message sur le téléphone.',
    carrier: 'SYNTACKS',
    notifApp: 'Messages',
    notifFrom: 'Marc',
    tapHint: 'Touchez Messages pour répondre',
    apps: { messages: 'Messages', arcade: 'Arcade', health: 'Bilan', trophies: 'Trophées', linkedin: 'LinkedIn', services: 'Services' },
    back: 'Retour à l’écran d’accueil',
    sentToast: 'Message envoyé',
    sentTo: 'À\u202f: Marc',
    now: 'maintenant',
    newMessage: '1 nouveau message',
    contact: 'Marc',
    contactSub: 'Consultant Salesforce · Bruxelles',
    hello: 'Bonjour\u202f! Dites-moi sur quoi vous travaillez, et je reviens vers vous.',
    name: 'Votre nom',
    namePh: 'Alex Janssens',
    company: 'Entreprise',
    companyPh: 'Facultatif',
    need: 'De quoi avez-vous besoin\u202f?',
    needs: ['Développement sur mesure', 'Intégration', 'Bilan de santé', 'Service Cloud', 'Données & migration', 'Autre chose'],
    timeline: 'Échéance',
    timelines: ['Au plus vite', 'Ce trimestre', 'Plus tard'],
    message: 'Message',
    messagePh: 'Une ou deux lignes sur le projet…',
    send: 'Envoyer',
    required: 'obligatoire',
    errors: {
      name: 'Comment dois-je vous appeler\u202f?',
      need: 'Choisissez-en au moins un, même si c’est «\u202fAutre chose\u202f».',
      message: 'Ajoutez une ou deux lignes pour que je sache par où commencer.',
    },
    summary: ({ name, company, need, timeline }) =>
      [`${name}${company ? `, ${company}` : ''}`, need.join(' · '), timeline].filter(Boolean).join(' — '),
    sending: 'Envoi…',
    delivered: 'Distribué',
    typing: 'Marc est en train d’écrire',
    passed: 'Mission réussie',
    passedSub: 'Message distribué',
    thanks: 'Merci — je reviens vers vous très vite.',
    faster: 'Plus rapide\u202f: écrivez-moi sur LinkedIn.',
    again: 'En envoyer un autre',
  },
}

// A front-end demo: this form sends nothing anywhere (no network call, no email). It only checks the
// fields and plays the "sent" animation, until a backend or a form service is connected.
const EMPTY = { name: '', company: '', need: [], timeline: '', message: '' }

function validate(f, TEXT) {
  const errors = {}
  if (!f.name.trim()) errors.name = TEXT.errors.name
  if (!f.need.length) errors.need = TEXT.errors.need
  if (!f.message.trim()) errors.message = TEXT.errors.message
  return errors
}

const brusselsTime = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })
const brusselsDate = (locale) =>
  new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Brussels' })

const BASE = import.meta.env.BASE_URL

// The home screen's apps: Messages opens the chat, the others are shortcuts around the site.
const APPS = [
  { id: 'messages', icon: '💬' },
  { id: 'arcade', icon: '🎮', href: `${BASE}arcade/` },
  { id: 'health', icon: '🩺', href: '#health-check' },
  { id: 'trophies', icon: '🏆', href: `${BASE}arcade/#/trophies` },
  { id: 'linkedin', icon: 'in', href: LINKEDIN_URL, external: true },
  { id: 'services', icon: '🧰', href: '#services' },
]

function LinkedInButton() {
  const TEXT = TEXTS[useLang().lang]
  return (
    <a href={LINKEDIN_URL} className="btn btn-light" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" className="li" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z" />
      </svg>
      {TEXT.linkedin}
    </a>
  )
}

// Chips that behave as checkboxes (`multi`) or as a radio group (pick one, tap again to clear).
function Chips({ id, options, value, multi, onChange, invalid, describedBy }) {
  const on = (o) => (multi ? value.includes(o) : value === o)
  const pick = (o) => onChange(multi ? (on(o) ? value.filter((v) => v !== o) : [...value, o]) : on(o) ? '' : o)
  return (
    <div className="ph-chips" id={id} role="group" aria-labelledby={`${id}-label`} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
      {options.map((o) => (
        <button type="button" key={o} className="ph-chip" aria-pressed={on(o)} onClick={() => pick(o)}>{o}</button>
      ))}
    </div>
  )
}

function FieldError({ id, text }) {
  return text ? <p className="ph-error" id={id}>{text}</p> : null
}

// The in-game phone: a messaging app with the form as the conversation.
function PhoneForm() {
  const { lang, locale } = useLang()
  const TEXT = TEXTS[lang]
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [stage, setStage] = useState('compose') // compose → sending → delivered → typing → passed
  const [sent, setSent] = useState(null)
  const [clock, setClock] = useState(brusselsTime)
  const [height, setHeight] = useState(0) // the screen keeps its height once the form is sent
  const [screen, setScreen] = useState('home') // home → chat (Messages)
  const [pulled, setPulled] = useState(false) // the phone slides up into view the first time it's seen
  const [notified, setNotified] = useState(false) // the incoming-message banner on the home screen
  const root = useRef(null)
  const timers = useRef([])

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      setPulled(true)
      setNotified(true)
      return
    }
    let t = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      setPulled(true)
      t = setTimeout(() => setNotified(true), 900)
    }, { threshold: 0.25 })
    io.observe(root.current)
    return () => {
      io.disconnect()
      clearTimeout(t)
    }
  }, [])

  const openChat = () => {
    setScreen('chat')
    setTimeout(() => root.current?.querySelector('#ph-name')?.focus({ preventScroll: true }), 350)
  }

  useEffect(() => {
    const t = setInterval(() => setClock(brusselsTime()), 30000)
    return () => {
      clearInterval(t)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  // After a reset or the success screen, put focus somewhere sensible inside the phone.
  useEffect(() => {
    if (stage === 'passed') root.current?.querySelector('.ph-passed h3')?.focus()
  }, [stage])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const found = validate(form, TEXT)
    setErrors(found)
    const first = ['name', 'need', 'message'].find((k) => found[k])
    if (first) {
      const el = root.current?.querySelector(`#ph-${first}`)
      ;(el?.matches('input, textarea') ? el : el?.querySelector('button'))?.focus()
      return
    }
    setHeight(root.current?.querySelector('.phone-screen')?.offsetHeight || 0)
    setSent({ ...form, name: form.name.trim(), company: form.company.trim(), message: form.message.trim() })
    setStage('sending')
    // A short buzz like a game phone, only after the visitor has tapped (browsers refuse it before).
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([18, 40, 18])
    const fast = matchMedia('(prefers-reduced-motion: reduce)').matches
    const steps = fast ? [['delivered', 300], ['typing', 600], ['passed', 900]] : [['delivered', 1100], ['typing', 1900], ['passed', 3600]]
    timers.current = steps.map(([s, ms]) => setTimeout(() => setStage(s), ms))
  }

  const again = () => {
    timers.current.forEach(clearTimeout)
    setForm(EMPTY)
    setErrors({})
    setSent(null)
    setHeight(0)
    setStage('compose')
    setTimeout(() => root.current?.querySelector('#ph-name')?.focus(), 0)
  }

  const composing = stage === 'compose'

  return (
    <div className={`phone${pulled ? ' pulled' : ''}`} ref={root}>
      <div className={`phone-screen on-${screen}`} style={height ? { minHeight: height } : undefined}>
        <div className="ph-status" aria-hidden="true">
          <span>{clock}</span>
          <i className="ph-cam" />
          <span className="ph-signal">{TEXT.carrier} <b><i /><i /><i /><i /></b></span>
        </div>

        {screen === 'home' && (
          <div className="ph-home">
            <p className="ph-home-time" aria-hidden="true">{clock}</p>
            <p className="ph-home-date">{brusselsDate(locale)}</p>
            {notified && (
              <button type="button" className="ph-notif" onClick={openChat}>
                <b><span aria-hidden="true">💬</span> {TEXT.notifApp}<small>{TEXT.now}</small></b>
                <span><strong>{TEXT.notifFrom}:</strong> {TEXT.hello}</span>
              </button>
            )}
            <div className="ph-apps">
              {APPS.map((a) => {
                const inner = (
                  <>
                    <i className={`ph-ico ico-${a.id}`} aria-hidden="true">{a.icon}</i>
                    <span>{TEXT.apps[a.id]}</span>
                    {a.id === 'messages' && notified && <b className="ph-badge" aria-label={TEXT.newMessage}>1</b>}
                  </>
                )
                return a.href ? (
                  <a key={a.id} className="ph-icon" href={a.href} {...(a.external ? { target: '_blank', rel: 'noopener' } : {})}>{inner}</a>
                ) : (
                  <button key={a.id} type="button" className="ph-icon" onClick={openChat}>{inner}</button>
                )
              })}
            </div>
            <p className="ph-hint">{TEXT.tapHint}</p>
          </div>
        )}

        {screen === 'chat' && (
          <div className="ph-chat">
            <div className="ph-app">
              <button type="button" className="ph-back" onClick={() => setScreen('home')} aria-label={TEXT.back}>‹</button>
              <span className="ph-avatar" aria-hidden="true">M</span>
              <span>
                <strong>{TEXT.contact}</strong>
                <small>{TEXT.contactSub}</small>
              </span>
            </div>
            {(stage === 'delivered' || stage === 'typing') && (
              <p className="ph-toast" role="status"><b>💬 {TEXT.sentToast}</b><span>{TEXT.sentTo}</span></p>
            )}

            <form className="ph-thread" onSubmit={submit} noValidate aria-label={TEXT.contact}>
              <p className="ph-bubble in">{TEXT.hello}</p>

              {composing && (
                <div className="ph-card">
                  <label className="ph-field">
                    <span className="ph-label">{TEXT.name} <em>· {TEXT.required}</em></span>
                    <input
                      id="ph-name" type="text" autoComplete="name" value={form.name} placeholder={TEXT.namePh}
                      onChange={(e) => set('name')(e.target.value)}
                      aria-invalid={Boolean(errors.name) || undefined} aria-describedby={errors.name ? 'ph-name-error' : undefined}
                    />
                    <FieldError id="ph-name-error" text={errors.name} />
                  </label>
                  <label className="ph-field">
                    <span className="ph-label">{TEXT.company}</span>
                    <input
                      id="ph-company" type="text" autoComplete="organization" value={form.company} placeholder={TEXT.companyPh}
                      onChange={(e) => set('company')(e.target.value)}
                    />
                  </label>
                  <div className="ph-field">
                    <span className="ph-label" id="ph-need-label">{TEXT.need} <em>· {TEXT.required}</em></span>
                    <Chips
                      id="ph-need" options={TEXT.needs} value={form.need} multi onChange={set('need')}
                      invalid={Boolean(errors.need)} describedBy={errors.need ? 'ph-need-error' : undefined}
                    />
                    <FieldError id="ph-need-error" text={errors.need} />
                  </div>
                  <div className="ph-field">
                    <span className="ph-label" id="ph-timeline-label">{TEXT.timeline}</span>
                    <Chips id="ph-timeline" options={TEXT.timelines} value={form.timeline} onChange={set('timeline')} />
                  </div>
                </div>
              )}

              {sent && (
                <div className="ph-out">
                  <div className="ph-bubble out">
                    <small>{TEXT.summary(sent)}</small>
                    {sent.message}
                  </div>
                  <span className="ph-meta" aria-live="polite">
                    {stage === 'sending' ? TEXT.sending : <>{TEXT.delivered} <b aria-hidden="true">✓✓</b></>}
                  </span>
                </div>
              )}
              {(stage === 'typing' || stage === 'passed') && (
                <p className="ph-bubble in ph-typing">
                  <span className="sr-only">{TEXT.typing}</span>
                  <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
                </p>
              )}

              {composing && (
                <div className="ph-composer">
                  <label className="ph-label" htmlFor="ph-message">{TEXT.message} <em>· {TEXT.required}</em></label>
                  <textarea
                    id="ph-message" rows={3} value={form.message} placeholder={TEXT.messagePh}
                    onChange={(e) => set('message')(e.target.value)}
                    aria-invalid={Boolean(errors.message) || undefined} aria-describedby={errors.message ? 'ph-message-error' : undefined}
                  />
                  <button type="submit" className="ph-send">
                    <span>{TEXT.send}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" /></svg>
                  </button>
                  <FieldError id="ph-message-error" text={errors.message} />
                </div>
              )}
            </form>
          </div>
        )}

        {stage === 'passed' && (
          <div className="ph-passed" role="status">
            <small>{TEXT.passedSub} <b aria-hidden="true">✓✓</b></small>
            <h3 tabIndex={-1}>{TEXT.passed}</h3>
            <p>{TEXT.thanks}</p>
            <p>{TEXT.faster}</p>
            <div className="ph-passed-actions">
              <LinkedInButton />
              <button type="button" className="btn ph-again" onClick={again}>{TEXT.again}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Contact() {
  const TEXT = TEXTS[useLang().lang]
  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="cta contact-cta reveal">
          <div className="cta-glow" aria-hidden="true" />
          <div className="contact-copy">
            <h2>{TEXT.title}</h2>
            <p>{TEXT.intro}</p>
            <div className="cta-actions">
              <LinkedInButton />
            </div>
            <p className="contact-or">{TEXT.or}</p>
          </div>
          <PhoneForm />
        </div>
      </div>
    </section>
  )
}
