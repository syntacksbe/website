import { useEffect, useRef, useState } from 'react'
import { DEFAULT_STATION, Radio, STATIONS } from '../radio.js'
import { useLang } from '../i18n.jsx'
import { stationUnlocked } from '../arcade/shopItems.js'
import { useProfile } from '../arcade/profile.js'
import { completeQuest } from '../gta/quests.js'
import { siren } from '../gta/screens.js'
import { onSignal, useGtaState } from '../gta/store.js'
import { useGtaText } from '../gta/text.js'
import './radio-dial.css'

const TEXTS = {
  en: {
    open: 'Syntacks FM radio', title: 'Syntacks FM', offAir: 'Off air', presets: 'Stations', preset: (n) => `P${n}`,
    prev: 'Previous station', next: 'Next station', play: 'Play the radio', stop: 'Stop the radio', volume: 'Volume',
    note: 'Generated live in your browser. Fake ads, no royalties.',
  },
  nl: {
    open: 'Syntacks FM-radio', title: 'Syntacks FM', offAir: 'Uit de ether', presets: 'Zenders', preset: (n) => `P${n}`,
    prev: 'Vorige zender', next: 'Volgende zender', play: 'Zet de radio aan', stop: 'Zet de radio uit', volume: 'Volume',
    note: 'Live gemaakt in je browser. Nepreclame, geen auteursrechten.',
  },
  fr: {
    open: 'Radio Syntacks FM', title: 'Syntacks FM', offAir: 'Hors antenne', presets: 'Stations', preset: (n) => `P${n}`,
    prev: 'Station précédente', next: 'Station suivante', play: 'Allumer la radio', stop: 'Éteindre la radio', volume: 'Volume',
    note: 'Généré en direct dans votre navigateur. Fausses pubs, sans droits d’auteur.',
  },
}

// Where a frequency sits on the FM scale (88–108 MHz), as a percentage.
const dialPos = (freq) => `${6 + ((Number(freq) - 88) / 20) * 88}%`

// Syntacks FM in the nav: off by default, the audio engine is only created on the first play.
// Used by the homepage and the Arcade header, without props.
// Between songs a DJ line or an ad plays (spoken by the browser's speech synthesis where it has a voice, with the
// music ducked and the words on the display); a switch turns them off. Stations bought in the Arcade shop and the
// pirate station (past the last one: a side quest) only show once unlocked.
const DJ_KEY = 'syntacks-radio-dj'
const FIRST_BREAK = 8 // bars after tuning in
const EVERY = 24 // bars between breaks

function djSaved() {
  try {
    return localStorage.getItem(DJ_KEY) !== 'off'
  } catch {
    return true
  }
}
export default function RadioDial() {
  const TEXT = TEXTS[useLang().lang]
  const R = useGtaText().radio
  const gta = useGtaState()
  useProfile() // re-render when a station is bought in the Arcade shop
  const [dj, setDj] = useState(djSaved)
  const [onAir, setOnAir] = useState(null) // { kind: 'ad' | 'dj', text } during a break
  const breaks = useRef(0)
  const live = useRef({})
  const radio = useRef(null)
  const box = useRef(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [station, setStation] = useState(DEFAULT_STATION)
  const [volume, setVolume] = useState(0.6)

  const engine = () => (radio.current ||= new Radio())
  live.current = { dj, R }

  // A break: a DJ line about the station, or an ad with a jingle first. The music ducks until the voice is done.
  const onBreak = () => {
    const { dj: on, R: words } = live.current
    const e = radio.current
    if (!on || !e?.playing || document.hidden) return
    const n = breaks.current++
    const ad = n % 2 === 1
    const s = STATIONS[e.station]
    const text = ad ? words.ads[Math.floor(n / 2) % words.ads.length] : words.dj[Math.floor(n / 2) % words.dj.length](s)
    setOnAir({ kind: ad ? 'ad' : 'dj', text })
    e.duck(true)
    if (ad) e.jingle()
    let done = false
    const end = () => {
      if (done) return
      done = true
      radio.current?.duck(false)
      setOnAir(null)
    }
    const fallback = setTimeout(end, 7000)
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = words.lang
      u.rate = 1.05
      u.pitch = ad ? 1.1 : 0.85
      u.volume = Math.min(1, e.volume + 0.3)
      u.onend = () => {
        clearTimeout(fallback)
        setTimeout(end, 300)
      }
      u.onerror = u.onend
      setTimeout(() => window.speechSynthesis.speak(u), ad ? 500 : 150)
    }
  }
  const breakRef = useRef(onBreak)
  breakRef.current = onBreak

  const wire = (e) => {
    e.onBar = (bars, t) => {
      if (bars !== FIRST_BREAK && (bars - FIRST_BREAK) % EVERY !== 0) return
      setTimeout(() => breakRef.current(), Math.max(0, (t - e.ctx.currentTime) * 1000))
    }
    return e
  }

  // The profile page can switch the DJ off or on.
  useEffect(() => {
    const sync = () => setDj(djSaved())
    window.addEventListener('syntacks-radio-dj', sync)
    return () => window.removeEventListener('syntacks-radio-dj', sync)
  }, [])

  // The police chase asks for a siren: over the music, or on its own with the sound effects on.
  useEffect(() => onSignal('siren', (sec) => (radio.current?.playing ? radio.current.siren(sec) : siren(sec))), [])

  const stopVoice = () => {
    try {
      window.speechSynthesis?.cancel()
    } catch {
      // Ignore.
    }
    setOnAir(null)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => {
    radio.current?.stop()
    stopVoice()
  }, [])

  const toggle = async () => {
    if (playing) {
      engine().stop()
      stopVoice()
      setPlaying(false)
    } else {
      setPlaying(true)
      await wire(engine()).play()
    }
  }

  // Only unlocked stations are on the dial; `station` stays an index into STATIONS.
  const visible = STATIONS.map((s, i) => ({ s, i })).filter(({ s }) => stationUnlocked(s.id))
  const pos = Math.max(0, visible.findIndex((v) => v.i === station))

  const tuneTo = (i) => {
    stopVoice()
    radio.current?.duck(false)
    setStation(i)
    engine().tune(i)
  }

  const tune = (step) => {
    // Past the last station there's a pirate signal, once.
    if (step > 0 && pos === visible.length - 1 && !gta.quests.includes('pirate')) {
      completeQuest('pirate')
      tuneTo(STATIONS.findIndex((s) => s.id === 'pirate'))
      return
    }
    tuneTo(visible[(pos + step + visible.length) % visible.length].i)
  }

  const flipDj = () => {
    const next = !dj
    setDj(next)
    if (!next) {
      stopVoice()
      radio.current?.duck(false)
    }
    try {
      localStorage.setItem(DJ_KEY, next ? 'on' : 'off')
    } catch {
      // Ignore.
    }
  }

  const current = STATIONS[station]

  return (
    <div className="radio" ref={box}>
      <button
        type="button"
        className={`radio-btn${playing ? ' on' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={TEXT.open}
        title={TEXT.title}
      >
        <span className="eq" aria-hidden="true"><i /><i /><i /></span>
        <span className="radio-btn-label">FM</span>
      </button>
      {open && (
        <div className="radio-pop" role="dialog" aria-label={TEXT.title}>
          <div className="radio-lcd">
            <small>
              {TEXT.title} · {current.freq}
              <b className="radio-ch">{TEXT.preset(pos + 1)}</b>
            </small>
            <strong key={current.id}>{current.name}</strong>
            <span className={onAir ? 'radio-onair' : undefined} aria-live="polite">
              {onAir ? `${onAir.kind === 'ad' ? `📣 ${R.ad}` : '🎙️ DJ'} · ${onAir.text}` : playing ? `♪ ${current.tagline}` : TEXT.offAir}
            </span>
          </div>
          <div className="radio-presets" role="group" aria-label={TEXT.presets}>
            {visible.map(({ s, i }, n) => (
              <button
                type="button" key={s.id} aria-pressed={i === station}
                aria-label={`${s.name}, ${s.freq} FM`} title={s.name} onClick={() => tuneTo(i)}
              >
                {n + 1}
              </button>
            ))}
          </div>
          <div className="radio-scale" aria-hidden="true">
            {visible.map(({ s, i }) => (
              <button type="button" tabIndex={-1} key={s.id} style={{ left: dialPos(s.freq) }} onClick={() => tuneTo(i)}>{s.freq}</button>
            ))}
            <span className="radio-needle" style={{ left: dialPos(current.freq) }} />
          </div>
          <div className="radio-controls">
            <button type="button" onClick={() => tune(-1)} aria-label={TEXT.prev}>⏮</button>
            <button type="button" className="radio-play" onClick={toggle} aria-label={playing ? TEXT.stop : TEXT.play}>
              {playing ? '■' : '▶'}
            </button>
            <button type="button" onClick={() => tune(1)} aria-label={TEXT.next}>⏭</button>
            <input
              type="range" min="0" max="1" step="0.05" value={volume} aria-label={TEXT.volume}
              onChange={(e) => {
                const v = Number(e.target.value)
                setVolume(v)
                engine().setVolume(v)
              }}
            />
          </div>
          <div className="radio-dj">
            <span>{R.dj}</span>
            <button type="button" role="switch" aria-checked={dj} className="gta-switch" onClick={flipDj}>{dj ? R.on : R.off}</button>
          </div>
          <p className="radio-note">{TEXT.note}</p>
        </div>
      )}
    </div>
  )
}
