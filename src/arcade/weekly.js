import { GAMES } from './catalog.js'
import { brusselsWeek, nextWeekStart, seeded } from './time.js'

// The weekly challenge: one featured game per ISO week (Brussels time), the same for everyone.
// Simulations are left out: their stars come from homepage badges.
export function weeklyChallenge(now = Date.now()) {
  const week = brusselsWeek(now)
  const pool = GAMES.filter((g) => g.type !== 'demo')
  const game = pool[Math.floor(seeded(`weekly-${week.key}`)() * pool.length)]
  const ends = nextWeekStart(now)
  const share = 1 - (ends - now) / (7 * 86400000)
  return { week, game, ends, share: Math.min(1, Math.max(0, share)) }
}
