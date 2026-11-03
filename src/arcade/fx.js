// Game feel for the Arcade: particle bursts, screen shake, haptics and small synth sounds.
// Sound is off until the player turns it on (saved in localStorage); motion respects
// prefers-reduced-motion; haptics only fire where the browser supports vibration.

const SOUND_KEY = 'syntacks-arcade-sound'
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
window.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY } }, { capture: true, passive: true })

export function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

export function setSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // Without storage the choice lasts for this visit only.
  }
  window.dispatchEvent(new Event('syntacks-sound'))
  if (on) beep('good', 0)
}

let audio = null
function ctx() {
  audio ||= new (window.AudioContext || window.webkitAudioContext)()
  if (audio.state === 'suspended') audio.resume()
  return audio
}

function tone(ac, { freq, at = 0, dur = 0.12, type = 'square', gain = 0.06, slide = 0 }) {
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur)
  amp.gain.setValueAtTime(gain, t)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(amp).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

// Short chiptune cues. `streak` raises the pitch of correct answers, like a combo.
export function beep(kind, streak = 0) {
  if (!soundOn()) return
  try {
    const ac = ctx()
    const up = 2 ** (Math.min(streak, 12) / 12) // a semitone higher per combo step, like a cascade
    if (kind === 'good') {
      tone(ac, { freq: 660 * up, dur: 0.09 })
      tone(ac, { freq: 990 * up, at: 0.07, dur: 0.12 })
    } else if (kind === 'bad') {
      tone(ac, { freq: 180, dur: 0.25, type: 'sawtooth', gain: 0.05, slide: 0.6 })
    } else if (kind === 'hit') {
      tone(ac, { freq: 240, dur: 0.12, type: 'square', gain: 0.07, slide: 0.4 })
    } else if (kind === 'tick') {
      tone(ac, { freq: 1200, dur: 0.03, type: 'triangle', gain: 0.03 })
    } else if (kind === 'win') {
      ;[523, 659, 784, 1046].forEach((f, i) => tone(ac, { freq: f, at: i * 0.1, dur: 0.18 }))
    } else if (kind === 'lose') {
      ;[392, 330, 262].forEach((f, i) => tone(ac, { freq: f, at: i * 0.14, dur: 0.22, type: 'triangle' }))
    }
  } catch {
    // Audio can be blocked; the game works silently.
  }
}

export function haptic(pattern) {
  // Browsers refuse (and log) vibration before the visitor's first tap, e.g. when a timer runs out.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported.
  }
}

// A burst of confetti-like particles at a screen point (defaults to the last tap).
export function burst({ x, y, colors = ['#ff5a1f', '#ffb21a', '#1fb5ad', '#ffd23f'], count = 18 } = {}) {
  if (reduced()) return
  const at = { x: x ?? lastPointer.x, y: y ?? lastPointer.y }
  const box = document.createElement('div')
  box.className = 'fx-burst'
  box.style.left = `${at.x}px`
  box.style.top = `${at.y}px`
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i')
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const dist = 40 + Math.random() * 70
    p.style.setProperty('--x', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--y', `${Math.sin(angle) * dist}px`)
    p.style.setProperty('--r', `${Math.random() * 540 - 270}deg`)
    p.style.background = colors[i % colors.length]
    box.appendChild(p)
  }
  document.body.appendChild(box)
  setTimeout(() => box.remove(), 900)
}

// Floating text ("+200", "COMBO x3") rising from the last tap.
export function floatText(text, { x, y, tone = 'good' } = {}) {
  const el = document.createElement('div')
  el.className = `fx-float ${tone}`
  el.textContent = text
  el.style.left = `${x ?? lastPointer.x}px`
  el.style.top = `${y ?? lastPointer.y}px`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1100)
}

export function shake(el) {
  if (!el || reduced()) return
  el.classList.remove('fx-shake')
  void el.offsetWidth // restart the animation
  el.classList.add('fx-shake')
  setTimeout(() => el.classList.remove('fx-shake'), 450)
}

// One call for a round result: particles + sound + haptic on a hit, shake + buzz on a miss.
export function feedback(score, { streak = 0, el } = {}) {
  if (score === 1) {
    burst()
    beep('good', streak)
    haptic(15)
  } else if (score > 0) {
    beep('good', 0)
    haptic(10)
  } else {
    shake(el)
    beep('bad')
    haptic([30, 40, 30])
  }
}
