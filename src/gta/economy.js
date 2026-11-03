import { useGame, useWanted } from '../game.jsx'
import { useGtaState } from './store.js'

// RP (reputation points) and the rank they give, shown in the pause menu and by the rank-up screen.
// Earned from homepage badges (their XP), Arcade stars, side quests and the health check.
// Gears and the shop belong to the Arcade only: see src/arcade/shop.js.
export const RP = { xp: 1, arcadeStar: 20, quest: 150, healthCheck: 200 }

// RP needed to reach rank n: 0, 100, 250, 450, 700, ... (each rank asks 50 RP more than the last).
export const rpFor = (rank) => 25 * (rank - 1) * (rank + 2)

export function rankFor(rp) {
  let rank = 1
  while (rpFor(rank + 1) <= rp) rank++
  return { rank, from: rpFor(rank), to: rpFor(rank + 1) }
}

export function useEconomy() {
  const { xp, level } = useGame()
  const { arcadeStars, healthCheck } = useWanted()
  const state = useGtaState()
  const rp = xp * RP.xp + arcadeStars * RP.arcadeStar + state.quests.length * RP.quest + (healthCheck ? RP.healthCheck : 0)
  return { rp, level, ...rankFor(rp), state }
}
