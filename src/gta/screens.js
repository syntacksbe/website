import { soundOn } from '../arcade/fx.js'

// Full-screen moments outside React, so any game can call them: "Wasted" (the page drains to grey in slow motion,
// for a timed game lost) and "Mission failed" (red, with a reason, for a lost boss fight).
// They remove themselves; a tap or Escape skips them. Reduced motion keeps the grey but drops the zoom.
let current = null

function overlay(className, title, line) {
  current?.()
  const html = document.documentElement
  const el = document.createElement('div')
  el.className = `gta-screen ${className}`
  el.setAttribute('role', 'alert')
  el.innerHTML = '<strong></strong><span></span>'
  el.firstChild.textContent = title
  el.lastChild.textContent = line ?? ''
  document.body.appendChild(el)
  html.classList.add(`gta-${className}`)
  let timer = 0
  const close = () => {
    clearTimeout(timer)
    el.remove()
    html.classList.remove(`gta-${className}`)
    document.removeEventListener('keydown', onKey)
    current = null
  }
  const onKey = (e) => e.key === 'Escape' && close()
  el.addEventListener('click', close)
  document.addEventListener('keydown', onKey)
  timer = setTimeout(close, 3400)
  current = close
}

let audio = null
function sound(kind) {
  if (!soundOn()) return
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const t = audio.currentTime
    const note = (freq, at, dur, type = 'sawtooth', gain = 0.07, slide = 1) => {
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t + at)
      if (slide !== 1) o.frequency.exponentialRampToValueAtTime(freq * slide, t + at + dur)
      g.gain.setValueAtTime(gain, t + at)
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur)
      o.connect(g).connect(audio.destination)
      o.start(t + at)
      o.stop(t + at + dur + 0.05)
    }
    if (kind === 'wasted') {
      note(90, 0, 1.6, 'sine', 0.25, 0.4) // a low boom
      note(220, 0.25, 1.4, 'triangle', 0.06, 0.5)
    } else {
      ;[330, 311, 262].forEach((f, i) => note(f, i * 0.28, 0.5, 'square', 0.05))
    }
  } catch {
    // Audio can be blocked; the screen still shows.
  }
}

export function wasted(line) {
  overlay('wasted', 'Wasted', line)
  sound('wasted')
}

export function missionFailed(line) {
  overlay('failed', 'Mission failed', line)
  sound('failed')
}

// The chase siren when the radio is off: only with the sound effects on.
export function siren(seconds = 4) {
  if (!soundOn()) return
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const t = audio.currentTime
    const o = audio.createOscillator()
    const lfo = audio.createOscillator()
    const depth = audio.createGain()
    const g = audio.createGain()
    o.type = 'triangle'
    o.frequency.value = 950
    lfo.frequency.value = 0.9
    depth.gain.value = 320
    lfo.connect(depth).connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.6)
    g.gain.setValueAtTime(0.04, t + seconds - 0.8)
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    o.connect(g).connect(audio.destination)
    o.start(t)
    lfo.start(t)
    o.stop(t + seconds + 0.1)
    lfo.stop(t + seconds + 0.1)
  } catch {
    // Audio can be blocked.
  }
}
