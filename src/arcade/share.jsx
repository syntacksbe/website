import { useState } from 'react'

// Share cards: a 1200×630 PNG drawn on a canvas in the Arcade style (asphalt, a striped sunset sun,
// a teal grid, Anton headings), shared as a file where the Web Share API takes files, else downloaded.
const W = 1200
const H = 630
const C = { bg: '#0d0e11', orange: '#ff7a33', blaze: '#ff5a1f', gold: '#ffb21a', teal: '#1fb5ad', text: '#f2efe9', muted: '#a8a299', dim: '#2a2d33', red: '#ff5a3c' }
const TONE = { good: C.teal, warn: C.gold, bad: C.red }

// Waits for the page fonts (Anton and the body font), but never longer than 1.5 s.
async function fontsReady() {
  if (!document.fonts?.load) return
  const load = Promise.all(['400 96px Anton', '800 28px "Plus Jakarta Sans"', '500 24px "JetBrains Mono"'].map((f) => document.fonts.load(f)))
  await Promise.race([load, new Promise((r) => setTimeout(r, 1500))]).catch(() => {})
}

function star(ctx, x, y, r, fill) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const d = i % 2 ? r * 0.45 : r
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

// Breaks text into lines that fit `width`: one line if it fits at 3/4 of `size` or more, else at
// most `max` lines, shrinking the font as needed.
function fit(ctx, text, width, size, max, font) {
  return wrap(ctx, text, width, size, 1, font, size * 0.75) ?? wrap(ctx, text, width, size, max, font, 40) ?? { lines: [text], size: 40 }
}

function wrap(ctx, text, width, size, max, font, min) {
  for (let s = size; s >= min; s -= 6) {
    ctx.font = font(s)
    const lines = []
    for (const word of text.split(/\s+/)) {
      const line = lines.length ? `${lines[lines.length - 1]} ${word}` : word
      if (lines.length && ctx.measureText(line).width <= width) lines[lines.length - 1] = line
      else lines.push(word)
    }
    if (lines.length <= max && lines.every((l) => ctx.measureText(l).width <= width)) return { lines, size: s }
  }
  return null
}

function backdrop(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#2b1a10')
  sky.addColorStop(0.55, '#15110f')
  sky.addColorStop(1, C.bg)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Striped retro sun on the horizon.
  const cx = 950
  const cy = 430
  const r = 210
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r)
  sun.addColorStop(0, '#ffd23f')
  sun.addColorStop(0.5, C.orange)
  sun.addColorStop(1, C.blaze)
  ctx.fillStyle = sun
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.fillStyle = '#15110f'
  for (let i = 0, y = cy + 10; y < cy + r; i++, y += 22 + i * 2) ctx.fillRect(cx - r, y, r * 2, 4 + i * 2)
  ctx.restore()

  // Teal perspective grid on the ground.
  const top = 470
  ctx.fillStyle = C.bg
  ctx.fillRect(0, top, W, H - top)
  ctx.strokeStyle = 'rgba(31, 181, 173, .45)'
  ctx.lineWidth = 2
  for (let i = 0; i < 9; i++) {
    const y = top + ((i / 8) ** 1.8) * (H - top)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath()
    ctx.moveTo(W / 2 + i * 40, top)
    ctx.lineTo(W / 2 + i * 220, H)
    ctx.stroke()
  }
  const fade = ctx.createLinearGradient(0, top, 0, top + 60)
  fade.addColorStop(0, '#15110f')
  fade.addColorStop(1, 'rgba(13, 14, 17, 0)')
  ctx.fillStyle = fade
  ctx.fillRect(0, top, W, 60)
}

// Draws a card. `card`: { kicker, title, stars (0–3, optional), big, unit, stamp: { label, tone }, grid: [['hit', …], …] }.
export function drawCard(canvas, card) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  backdrop(ctx)
  const x = 72
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = C.orange
  ctx.font = '800 26px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText((card.kicker ?? 'Syntacks Arcade').toUpperCase().split('').join(String.fromCharCode(8202)), x, 92)

  const title = fit(ctx, card.title.toUpperCase(), 660, 104, 2, (s) => `400 ${s}px Anton, Impact, sans-serif`)
  ctx.fillStyle = C.text
  ctx.shadowColor = 'rgba(255, 90, 31, .55)'
  ctx.shadowBlur = 24
  title.lines.forEach((l, i) => ctx.fillText(l, x, 92 + title.size * (i + 1) * 1.02))
  ctx.shadowBlur = 0
  let y = 92 + title.size * title.lines.length * 1.02 + 30

  if (card.grid) {
    const cell = Math.min(34, Math.floor(180 / card.grid.length) - 6)
    card.grid.forEach((row, r) => row.forEach((s, i) => {
      ctx.fillStyle = s === 'hit' ? '#1a7a3f' : s === 'near' ? C.gold : C.dim
      ctx.fillRect(x + i * (cell + 6), y + r * (cell + 6), cell, cell)
    }))
    y += card.grid.length * (cell + 6) + 8
  } else if (card.stars != null) {
    for (let i = 0; i < 3; i++) star(ctx, x + 40 + i * 92, y + 40, 40, i < card.stars ? C.gold : C.dim)
    y += 96
  }

  ctx.fillStyle = C.gold
  ctx.font = '400 76px Anton, Impact, sans-serif'
  const big = String(card.big ?? '')
  ctx.fillText(big, x, y + 70)
  const bw = ctx.measureText(big).width
  ctx.fillStyle = C.text
  ctx.font = '700 30px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText(card.unit ?? '', x + bw + 18, y + 66)

  if (card.stamp) {
    ctx.save()
    ctx.translate(960, 150)
    ctx.rotate(-0.12)
    ctx.font = '400 52px Anton, Impact, sans-serif'
    const label = card.stamp.label.toUpperCase()
    const w = ctx.measureText(label).width + 44
    ctx.strokeStyle = TONE[card.stamp.tone] ?? C.gold
    ctx.fillStyle = 'rgba(13, 14, 17, .72)'
    ctx.lineWidth = 6
    ctx.fillRect(-w / 2, -44, w, 84)
    ctx.strokeRect(-w / 2, -44, w, 84)
    ctx.fillStyle = ctx.strokeStyle
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, 22)
    ctx.restore()
  }

  // Footer bar: brand on the left, the address on the right.
  ctx.fillStyle = 'rgba(13, 14, 17, .86)'
  ctx.fillRect(0, H - 72, W, 72)
  ctx.fillStyle = C.blaze
  ctx.fillRect(0, H - 72, W, 4)
  ctx.font = '400 34px Anton, Impact, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText('SYNTACKS', x, H - 22)
  const sw = ctx.measureText('SYNTACKS ').width
  ctx.fillStyle = C.orange
  ctx.fillText('ARCADE', x + sw, H - 22)
  ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillStyle = C.teal
  ctx.textAlign = 'right'
  ctx.fillText(card.url ?? '', W - x, H - 26)
  ctx.textAlign = 'left'
}

const arcadeUrl = () => `${window.location.origin}${window.location.pathname}`

export async function shareCard(card, { text, link } = {}) {
  await fontsReady()
  const canvas = document.createElement('canvas')
  drawCard(canvas, { url: arcadeUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), ...card })
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('no image')
  const name = `syntacks-arcade-${card.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`
  const file = new File([blob], name, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: card.title, text: [text, link ?? arcadeUrl()].filter(Boolean).join(' ') })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // Some browsers refuse files after all: fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

// "📸 Share card" button that says how it went.
export function ShareCardButton({ card, text, link, className = 'btn btn-ghost btn-sm' }) {
  const [state, setState] = useState('')
  async function go() {
    setState('busy')
    try {
      const how = await shareCard(card, { text, link })
      setState(how === 'downloaded' ? 'saved' : '')
    } catch {
      setState('failed')
    }
  }
  return (
    <button type="button" className={className} onClick={go} disabled={state === 'busy'}>
      📸 {state === 'busy' ? 'Drawing…' : state === 'saved' ? 'Card saved' : state === 'failed' ? 'Couldn’t draw it' : 'Share card'}
    </button>
  )
}
