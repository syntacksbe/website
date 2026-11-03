import { useEffect, useState } from 'react'

// Brussels calendar helpers: the weekly challenge and leaderboard reset on Monday 00:00 Brussels time.
const ZONE = 'Europe/Brussels'

function parts(t) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return Object.fromEntries(fmt.formatToParts(t).map((p) => [p.type, Number(p.value)]))
}

// How far Brussels is ahead of UTC at instant t, in ms (1 or 2 hours).
function offset(t) {
  const p = parts(t)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000
}

// The ISO week of today in Brussels: { key: '2026-W45', year, week, start (UTC date of its Monday) }.
export function brusselsWeek(now = Date.now()) {
  const p = parts(now)
  const day = new Date(Date.UTC(p.year, p.month - 1, p.day))
  const iso = day.getUTCDay() || 7 // Monday 1 … Sunday 7
  const thursday = new Date(day)
  thursday.setUTCDate(day.getUTCDate() + 4 - iso)
  const year = thursday.getUTCFullYear()
  const week = Math.ceil(((thursday - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  const monday = new Date(day)
  monday.setUTCDate(day.getUTCDate() + 1 - iso)
  return { key: `${year}-W${String(week).padStart(2, '0')}`, year, week, monday }
}

// The instant of next Monday 00:00 in Brussels.
export function nextWeekStart(now = Date.now()) {
  const { monday } = brusselsWeek(now)
  const wall = Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 7)
  const guess = wall - offset(wall)
  return wall - offset(guess)
}

// "3d 14h 05m", or "14h 05m 09s" on the last day.
export function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  return d ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${String(s % 60).padStart(2, '0')}s`
}

// The current time, refreshed every `every` ms.
export function useNow(every = 1000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

// A small seeded random generator, so everyone sees the same picks in the same week.
export function seeded(text) {
  let h = 1779033703 ^ text.length
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19))
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}
