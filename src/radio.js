// Syntacks FM: synthwave generated live with the Web Audio API — no audio files, nothing to license.
// Each station is a 4-bar loop: drums, bass, an arpeggio and a pad, scheduled a little ahead of time.
// Optional per station: `bassWave`, `tone` (a low-pass on the whole mix, in Hz), `vinyl` (hiss and
// crackle) and `wow` (random detune in cents, like a warped record).

// In dial order, low to high frequency. Apex FM is the default. `unlock` marks the stations that only show on the
// dial once bought in the pause-menu shop ('shop') or found as a side quest ('quest', past 107.9).
export const STATIONS = [
  {
    id: 'lofi', freq: '89.3', name: 'Lo-fi Focus', tagline: 'Beats to debug to',
    bpm: 72, arpWave: 'triangle', bassWave: 'sine', swing: 0.18, tone: 2400, vinyl: true, wow: 14,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], // Fmaj7 Em7 Dm7 Cmaj7
    roots: [41, 40, 38, 36],
    kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: (s) => (s === 0 || s === 10 ? 0 : s === 7 ? 7 : null),
    arp: (s) => ({ 0: 3, 6: 2, 10: 1, 14: 4 })[s] ?? null,
  },
  {
    id: 'sunset', freq: '92.5', name: 'Sunset Strip', tagline: 'Outrun the release train', unlock: 'shop',
    bpm: 108, arpWave: 'sawtooth',
    chords: [[54, 57, 61], [50, 54, 57], [57, 61, 64], [52, 56, 59]], // F#m D A E
    roots: [42, 38, 45, 40],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: (s) => (s % 2 ? null : s % 4 ? 12 : 0),
    arp: (s) => [0, 1, 2, 3, 2, 1][s % 6],
  },
  {
    id: 'flow', freq: '94.7', name: 'Flow Radio', tagline: 'Low-code, low-tempo',
    bpm: 84, arpWave: 'triangle', swing: 0.12,
    chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]], // Dmaj7 Bm7 Gmaj7 A6
    roots: [38, 47, 43, 45],
    kick: [0, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: (s) => (s === 0 || s === 10 ? 0 : s === 7 ? 7 : null),
    arp: (s) => ({ 0: 0, 3: 2, 6: 1, 8: 3, 11: 2, 14: 1 })[s] ?? null,
  },
  {
    id: 'heist', freq: '96.3', name: 'Heist FM', tagline: 'Tense synths for go-live night', unlock: 'shop',
    bpm: 96, arpWave: 'square', tone: 4200,
    chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [52, 56, 59]], // Am Am F E
    roots: [45, 45, 41, 40],
    kick: [0, 6, 8, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: (s) => (s % 2 ? null : 0),
    arp: (s) => (s % 3 ? null : [0, 2, 1, 3, 1, 2][(s / 3) % 6]),
  },
  {
    id: 'night', freq: '98.1', name: 'Night Shift', tagline: 'Dark synth for the after-hours deploy',
    bpm: 90, arpWave: 'square', tone: 5200,
    chords: [[48, 51, 55], [44, 48, 51], [51, 55, 58], [46, 50, 53]], // Cm Ab Eb Bb
    roots: [36, 32, 39, 34],
    kick: [0, 3, 10], snare: [8], hat: [2, 6, 10, 14],
    bass: (s) => (s === 0 || s === 3 || s === 10 ? 0 : s === 14 ? 12 : null),
    arp: (s) => (s % 2 ? null : [0, 2, 1, 3, 2, 4, 3, 1][s / 2]),
  },
  {
    id: 'apex', freq: '101.3', name: 'Apex FM', tagline: 'Bulkified synthwave, 24/7',
    bpm: 100, arpWave: 'sawtooth',
    chords: [[57, 60, 64], [53, 57, 60], [52, 55, 60], [55, 59, 62]], // Am F C G
    roots: [45, 41, 48, 43],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: (s) => (s % 2 === 0 ? (s % 4 === 0 ? 0 : 12) : null),
    arp: (s) => [0, 1, 2, 1][s % 4],
  },
  {
    id: 'deploy', freq: '104.5', name: 'Deploy Day', tagline: 'All tests green, full throttle',
    bpm: 132, arpWave: 'sawtooth',
    chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], // Dm Bb F C
    roots: [38, 34, 41, 36],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [...Array(16).keys()],
    bass: (s) => (s % 2 ? 12 : 0),
    arp: (s) => [0, 1, 2, 3, 2, 1, 0, 1][s % 8] + (s >= 12 ? 1 : 0),
  },
  {
    id: 'batch', freq: '107.9', name: 'Batch Beats', tagline: '200 records per chunk',
    bpm: 118, arpWave: 'square',
    chords: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]], // Em C D Bm
    roots: [40, 36, 38, 35],
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [...Array(16).keys()],
    bass: (s) => (s % 4 === 0 ? null : s % 2 ? 0 : 12),
    arp: (s) => [0, 2, 1, 2][s % 4] + (s >= 8 ? 3 : 0),
  },
  {
    id: 'pirate', freq: '108.0', name: 'Pirate 108', tagline: 'Unlicensed, untested, deployed on a Friday', unlock: 'quest',
    bpm: 126, arpWave: 'square', tone: 3000, vinyl: true, wow: 30,
    chords: [[50, 53, 57], [50, 53, 57], [48, 52, 55], [46, 50, 53]], // Dm Dm C Bb
    roots: [38, 38, 36, 34],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: (s) => (s % 2 ? 12 : 0),
    arp: (s) => [0, 2, 1, 2, 0, 3, 1, 2][s % 8],
  },
]

export const DEFAULT_STATION = STATIONS.findIndex((s) => s.id === 'apex')

const midi = (n) => 440 * 2 ** ((n - 69) / 12)

export class Radio {
  constructor() {
    this.station = DEFAULT_STATION
    this.volume = 0.6
    this.playing = false
  }

  init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)())
    this.out = ctx.createGain()
    this.master = ctx.createGain()
    this.master.gain.value = this.volume
    const comp = ctx.createDynamicsCompressor()
    this.tone = this.filter('lowpass', 20000)
    this.out.connect(this.tone).connect(this.master).connect(comp).connect(ctx.destination)

    // Shared echo for snare, arp and pad.
    this.delay = ctx.createDelay(1)
    const feedback = ctx.createGain()
    feedback.gain.value = 0.35
    this.wet = ctx.createGain()
    this.wet.gain.value = 0.3
    this.delay.connect(feedback).connect(this.delay)
    this.delay.connect(this.wet).connect(this.out)

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }

  get s() { return STATIONS[this.station] }
  get stepDur() { return 60 / this.s.bpm / 4 }

  async play() {
    if (!this.ctx) this.init()
    await this.ctx.resume()
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(0, t)
    this.out.gain.linearRampToValueAtTime(0.5, t + 0.4)
    this.playing = true
    this.restart()
    this.crackle(0.3)
  }

  stop() {
    if (!this.ctx || !this.playing) return
    this.playing = false
    clearInterval(this.timer)
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(this.out.gain.value, t)
    this.out.gain.linearRampToValueAtTime(0, t + 0.15)
    setTimeout(() => !this.playing && this.ctx.suspend(), 250)
  }

  tune(index) {
    this.station = (index + STATIONS.length) % STATIONS.length
    if (!this.playing) return
    this.crackle(0.35)
    this.restart(0.3)
  }

  setVolume(v) {
    this.volume = v
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  restart(after = 0.05) {
    clearInterval(this.timer)
    this.delay.delayTime.setValueAtTime(this.stepDur * 3, this.ctx.currentTime)
    this.tone.frequency.setTargetAtTime(this.s.tone ?? 20000, this.ctx.currentTime, 0.05)
    this.step = 0
    this.bars = 0
    this.next = this.ctx.currentTime + after
    this.timer = setInterval(() => this.tick(), 25)
    this.tick()
  }

  // Schedule every 16th note that falls inside the look-ahead window.
  // Background tabs fire timers less often, so look further ahead while hidden.
  tick() {
    const ahead = document.hidden ? 1.5 : 0.15
    while (this.next < this.ctx.currentTime + ahead) {
      const swing = this.s.swing && this.step % 2 ? this.s.swing * this.stepDur : 0
      this.schedule(this.step, this.next + swing)
      this.next += this.stepDur
      this.step++
    }
  }

  schedule(step, t) {
    const s = this.s
    const st = step % 16
    const bar = Math.floor(step / 16) % s.chords.length
    const chord = s.chords[bar]
    if (s.kick.includes(st)) this.kick(t)
    if (s.snare.includes(st)) this.snare(t)
    if (s.hat.includes(st)) this.hat(t, st % 4 === 2 ? 0.12 : 0.06)
    const b = s.bass(st)
    if (b !== null) this.bass(t, s.roots[bar] + b)
    const a = s.arp(st)
    if (a !== null) this.arp(t, chord[a % chord.length] + 12 * (1 + Math.floor(a / chord.length)), s.arpWave)
    if (st === 0) this.pad(t, chord, this.stepDur * 16)
    if (st === 0) this.onBar?.(++this.bars, t)
    if (s.vinyl) this.vinyl(t, st)
  }

  env(t, peak, decay, attack = 0.005) {
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
    return g
  }

  noiseSource(t, dur, loop = false) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = loop
    src.start(t)
    src.stop(t + dur)
    return src
  }

  filter(type, freq) {
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    return f
  }

  kick(t) {
    const o = this.ctx.createOscillator()
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    o.connect(this.env(t, 0.9, 0.32)).connect(this.out)
    o.start(t)
    o.stop(t + 0.4)
  }

  snare(t) {
    const g = this.env(t, 0.35, 0.17)
    this.noiseSource(t, 0.2).connect(this.filter('highpass', 1500)).connect(g)
    g.connect(this.out)
    g.connect(this.delay)
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = 185
    o.connect(this.env(t, 0.25, 0.08)).connect(this.out)
    o.start(t)
    o.stop(t + 0.1)
  }

  hat(t, vol) {
    this.noiseSource(t, 0.06).connect(this.filter('highpass', 7500)).connect(this.env(t, vol, 0.045)).connect(this.out)
  }

  // Random detune for the warped-record wobble.
  wobble(o) {
    if (this.s.wow) o.detune.value += (Math.random() - 0.5) * this.s.wow
  }

  bass(t, note) {
    const o = this.ctx.createOscillator()
    o.type = this.s.bassWave || 'sawtooth'
    o.frequency.value = midi(note)
    const f = this.filter('lowpass', 900)
    f.frequency.setValueAtTime(900, t)
    f.frequency.exponentialRampToValueAtTime(180, t + 0.2)
    o.connect(f).connect(this.env(t, 0.32, this.stepDur * 1.6)).connect(this.out)
    o.start(t)
    o.stop(t + this.stepDur * 2)
  }

  arp(t, note, wave) {
    const o = this.ctx.createOscillator()
    o.type = wave
    o.frequency.value = midi(note)
    this.wobble(o)
    const g = this.env(t, wave === 'triangle' ? 0.16 : 0.07, 0.22)
    o.connect(this.filter('lowpass', 2600)).connect(g)
    g.connect(this.out)
    g.connect(this.delay)
    o.start(t)
    o.stop(t + 0.3)
  }

  pad(t, chord, dur) {
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.5)
    g.gain.setValueAtTime(0.05, t + dur - 0.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const f = this.filter('lowpass', 1100)
    f.connect(g)
    g.connect(this.out)
    g.connect(this.delay)
    chord.forEach((n) => {
      ;[-7, 7].forEach((cents) => {
        const o = this.ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = midi(n)
        o.detune.value = cents
        this.wobble(o)
        o.connect(f)
        o.start(t)
        o.stop(t + dur)
      })
    })
  }

  // Vinyl: a soft hiss under every bar plus random crackle pops.
  vinyl(t, st) {
    if (st === 0) {
      const dur = this.stepDur * 16
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.025, t + 0.05)
      g.gain.setValueAtTime(0.025, t + dur - 0.05)
      g.gain.linearRampToValueAtTime(0.0001, t + dur)
      this.noiseSource(t, dur, true).connect(this.filter('bandpass', 3800)).connect(g).connect(this.out)
    }
    if (Math.random() < 0.35) {
      const at = t + Math.random() * this.stepDur
      this.noiseSource(at, 0.012).connect(this.filter('highpass', 2500)).connect(this.env(at, 0.05 + Math.random() * 0.12, 0.008, 0.001)).connect(this.out)
    }
  }

  // The music drops under a DJ line or an ad, and comes back after.
  duck(down) {
    if (!this.ctx || !this.playing) return
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(this.out.gain.value, t)
    this.out.gain.linearRampToValueAtTime(down ? 0.12 : 0.5, t + 0.4)
  }

  // A short station jingle before an ad, straight to the speakers (not ducked).
  jingle() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    ;[72, 76, 79, 84].forEach((n, i) => {
      const o = this.ctx.createOscillator()
      o.type = 'square'
      o.frequency.value = midi(n)
      o.connect(this.env(t + i * 0.11, 0.08, 0.2)).connect(this.master)
      o.start(t + i * 0.11)
      o.stop(t + i * 0.11 + 0.25)
    })
  }

  // A police siren over the music: a tone sweeping up and down, fading in and out.
  siren(seconds = 4) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const lfo = this.ctx.createOscillator()
    const depth = this.ctx.createGain()
    const g = this.ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = 950
    lfo.frequency.value = 0.9
    depth.gain.value = 320
    lfo.connect(depth).connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.6)
    g.gain.setValueAtTime(0.06, t + seconds - 0.8)
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    o.connect(g).connect(this.master)
    o.start(t)
    lfo.start(t)
    o.stop(t + seconds + 0.1)
    lfo.stop(t + seconds + 0.1)
  }

  // A burst of tuning static between stations.
  crackle(dur) {
    const t = this.ctx.currentTime
    this.noiseSource(t, dur).connect(this.filter('bandpass', 2200)).connect(this.env(t, 0.18, dur, 0.02)).connect(this.out)
  }
}
