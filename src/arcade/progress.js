import { useCallback, useEffect, useState } from 'react'
import { ACHIEVEMENTS, useGame } from '../game.jsx'

// Best stars (0–3) per Arcade game, saved in localStorage. Simulations take their stars from the
// badges of that demo (src/game.jsx), so the stars and the XP in the menu always agree.
const KEY = 'syntacks-arcade-catalog-v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export const RANKS = [
  { min: 0, name: 'Rookie' },
  { min: 15, name: 'Admin' },
  { min: 45, name: 'Developer' },
  { min: 90, name: 'Consultant' },
  { min: 150, name: 'Architect' },
  { min: 200, name: 'Technical Architect' },
]

export const rankFor = (stars) => [...RANKS].reverse().find((r) => stars >= r.min)

// 0–3 stars for a share of correct answers.
export const starsFor = (share) => (share >= 0.9 ? 3 : share >= 0.7 ? 2 : share >= 0.4 ? 1 : 0)

export function useProgress() {
  const [best, setBest] = useState(load)
  const { has } = useGame()

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(best))
    } catch {
      // Storage can be unavailable (private mode); progress then lasts for this visit only.
    }
  }, [best])

  const starsOf = useCallback(
    (game) => {
      if (game.type !== 'demo') return best[game.id] ?? 0
      const badges = ACHIEVEMENTS.filter((a) => a.demo === game.demo)
      return Math.round((badges.filter((a) => has(a.id)).length / badges.length) * 3)
    },
    [best, has],
  )

  const record = useCallback((id, stars) => setBest((b) => (!(id in b) || stars > b[id] ? { ...b, [id]: stars } : b)), [])
  const played = useCallback((game) => game.type === 'demo' ? starsOf(game) > 0 : game.id in best, [best, starsOf])

  return { starsOf, record, played, reset: () => setBest({}) }
}
