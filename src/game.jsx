import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useGtaState } from './gta/store.js'

// Every badge a visitor can earn. `demo` groups them per demo tab.
export const ACHIEVEMENTS = [
  { id: 'limit-hit', demo: 'limits', icon: '💥', title: 'Limit breaker', text: 'Hit your first governor limit', xp: 50 },
  { id: 'limit-sharp', demo: 'limits', icon: '🎯', title: 'Sharp eye', text: 'Pick the right fix on the first try', xp: 75 },
  { id: 'limit-fix', demo: 'limits', icon: '⚡', title: 'Bulkifier', text: 'Run a fixed scenario at scale', xp: 100 },
  { id: 'limit-all', demo: 'limits', icon: '🧙', title: 'Limit whisperer', text: 'Fix all five governor limit scenarios', xp: 250 },
  { id: 'int-test', demo: 'integration', icon: '🔌', title: 'Stress tester', text: 'Run your first integration stress test', xp: 50 },
  { id: 'int-outage', demo: 'integration', icon: '🌙', title: 'Outage-proof', text: 'Design an integration that survives an outage', xp: 100 },
  { id: 'int-stars', demo: 'integration', icon: '⭐', title: 'Integration architect', text: 'Get 3 stars on the integration brief', xp: 150 },
  { id: 'dm-explore', demo: 'datamodel', icon: '🗺️', title: 'Cartographer', text: 'Explore all three industry models', xp: 75 },
  { id: 'dm-ace', demo: 'datamodel', icon: '🏛️', title: 'Architect', text: 'Ace an architect challenge (3/3)', xp: 150 },
  { id: 'dm-all', demo: 'datamodel', icon: '👑', title: 'Chief architect', text: 'Ace all three architect challenges', xp: 250 },
  { id: 'sd-shift', demo: 'service', icon: '🎧', title: 'First shift', text: 'Run your first service desk shift', xp: 50 },
  { id: 'sd-human', demo: 'service', icon: '🤹', title: 'Human router', text: 'With routing off, assign 8 cases yourself', xp: 75 },
  { id: 'sd-zero', demo: 'service', icon: '🛡️', title: 'Zero breaches', text: 'Finish a shift without a single SLA breach', xp: 150 },
  { id: 'sd-night', demo: 'service', icon: '🦉', title: 'Night shift', text: 'Run a shift after 21:00, Brussels time', xp: 50 },
  { id: 'sc-quarter', demo: 'sales', icon: '📈', title: 'First quarter', text: 'Run your first sales quarter', xp: 50 },
  { id: 'sc-speed', demo: 'sales', icon: '⚡', title: 'Speed to lead', text: 'Finish a quarter without losing a lead to a competitor', xp: 100 },
  { id: 'sc-whale', demo: 'sales', icon: '🐋', title: 'Whale hunter', text: 'Close the Royal Delta Group deal', xp: 75 },
  { id: 'sc-quota', demo: 'sales', icon: '🚀', title: 'Quota crusher', text: 'Finish a quarter above 100% of quota', xp: 150 },
]

export const MAX_XP = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0)

export const LEVELS = [
  { min: 0, name: 'Visitor' },
  { min: 100, name: 'Admin' },
  { min: 300, name: 'Developer' },
  { min: 600, name: 'Consultant' },
  { min: 1000, name: 'Architect' },
  { min: MAX_XP, name: 'Technical Architect' },
]

const STORAGE_KEY = 'syntacks-arcade-v1'

// Progress flags each demo stores next to its badges (e.g. 'lim:soql:solved').
const FLAG_PREFIX = { limits: 'lim:', datamodel: 'dm:' }

// Whether a stored key — a badge id or a progress flag — belongs to a demo.
export function belongsTo(key, demo) {
  const prefix = FLAG_PREFIX[demo]
  return ACHIEVEMENTS.some((a) => a.id === key && a.demo === demo) || Boolean(prefix && key.startsWith(prefix))
}

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function save(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    // Storage can be unavailable (private mode); progress then lasts for this visit only.
  }
}

function xpOf(keys) {
  return ACHIEVEMENTS.reduce((sum, a) => sum + (keys.has(a.id) ? a.xp : 0), 0)
}

export function levelFor(xp) {
  let index = 0
  LEVELS.forEach((l, i) => { if (xp >= l.min) index = i })
  return { ...LEVELS[index], rank: index + 1, next: LEVELS[index + 1] ?? null }
}

const GameContext = createContext(null)

// The demo tab a component is rendered in, so shared pieces (like Quest) can show its badges.
export const DemoContext = createContext(null)

// `done` holds achievement ids plus free-form progress flags (e.g. 'lim:soql:solved').
export function GameProvider({ children }) {
  const [done, setDone] = useState(load)
  const [toasts, setToasts] = useState([])
  const doneRef = useRef(done)

  useEffect(() => save(done), [done])

  const has = useCallback((key) => doneRef.current.has(key), [])

  const mark = useCallback((key) => {
    if (doneRef.current.has(key)) return
    const next = new Set(doneRef.current)
    next.add(key)
    doneRef.current = next
    setDone(next)

    const achievement = ACHIEVEMENTS.find((a) => a.id === key)
    if (!achievement) return
    // Level-ups show as the rank-up screen (src/gta/RankUp.jsx), not as a toast.
    const stamp = Date.now()
    setToasts((t) => [
      ...t,
      { uid: `${key}-${stamp}`, icon: achievement.icon, label: `Badge unlocked · +${achievement.xp} XP`, title: achievement.title, text: achievement.text },
    ])
  }, [])

  // Starts one demo over: clears its badges (and their XP) plus its progress flags.
  const resetDemo = useCallback((demo) => {
    const next = new Set([...doneRef.current].filter((k) => !belongsTo(k, demo)))
    doneRef.current = next
    setDone(next)
  }, [])

  const dismiss = useCallback((uid) => setToasts((t) => t.filter((x) => x.uid !== uid)), [])

  const reset = useCallback(() => {
    doneRef.current = new Set()
    setDone(doneRef.current)
  }, [])

  const value = useMemo(() => {
    const xp = xpOf(done)
    return { done, has, mark, resetDemo, reset, xp, level: levelFor(xp), toasts, dismiss }
  }, [done, has, mark, resetDemo, reset, toasts, dismiss])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  return useContext(GameContext)
}

// Wanted level: five header stars that fill up as a visitor engages with the site.
// Points per homepage badge, per Arcade star and for a finished health check; a star at each threshold.
export const WANTED_POINTS = { badge: 2, arcadeStar: 1, healthCheck: 6 }
export const WANTED_STARS = [1, 5, 10, 16, 25]

// Written by src/arcade/progress.js and HealthCheck.jsx; only read here.
const ARCADE_KEY = 'syntacks-arcade-catalog-v1'
const HEALTH_KEY = 'syntacks-health-check-v1'

function readElsewhere() {
  let arcadeStars = 0
  let healthCheck = false
  try {
    const best = JSON.parse(localStorage.getItem(ARCADE_KEY) || '{}')
    arcadeStars = Object.values(best || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
  } catch {
    // Unreadable or no storage: count no Arcade stars.
  }
  try {
    healthCheck = Boolean(JSON.parse(localStorage.getItem(HEALTH_KEY) || '{}')?.done)
  } catch {
    // Same for the health check.
  }
  return { arcadeStars, healthCheck }
}

export function wantedFor(points) {
  return WANTED_STARS.filter((min) => points >= min).length
}

// `stars` (0–5) plus what went into it. Needs a GameProvider.
export function useWanted() {
  const { done } = useGame()
  const [elsewhere, setElsewhere] = useState(readElsewhere)

  // The health check and the Arcade keep their own storage and send no event, so look again now and then.
  useEffect(() => {
    const look = () => {
      if (document.hidden) return
      const next = readElsewhere()
      setElsewhere((e) => (e.arcadeStars === next.arcadeStars && e.healthCheck === next.healthCheck ? e : next))
    }
    const timer = setInterval(look, 2000)
    window.addEventListener('storage', look)
    window.addEventListener('focus', look)
    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', look)
      window.removeEventListener('focus', look)
    }
  }, [])

  const badges = ACHIEVEMENTS.filter((a) => done.has(a.id)).length
  const raw = badges * WANTED_POINTS.badge + elsewhere.arcadeStars * WANTED_POINTS.arcadeStar + (elsewhere.healthCheck ? WANTED_POINTS.healthCheck : 0)
  // Losing the heat (the police chase in src/gta/Chase.jsx) clears the stars: they count again from that point.
  const { heat } = useGtaState()
  const points = Math.max(0, raw - heat)
  const stars = wantedFor(points)
  return { stars, points, raw, next: WANTED_STARS[stars] ?? null, badges, ...elsewhere }
}
