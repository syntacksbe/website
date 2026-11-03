import { gameById } from './catalog.js'
import { readJson, writeJson } from './store.js'

// Every round the player got wrong (score < 1) in classic, boss and escape mode, oldest first:
// [{ g: game id, r: round index, t: time }]. A round leaves the list once it's answered right.
const KEY = 'syntacks-arcade-misses'
const CAP = 200

// Misses of games that no longer exist are left out (and dropped on the next save).
export const misses = () => readJson(KEY, []).filter((m) => typeof m?.g === 'string' && Number.isInteger(m.r) && gameById(m.g))

export function noteRound(game, round, score) {
  const list = misses()
  const rest = list.filter((m) => m.g !== game || m.r !== round)
  if (score < 1) rest.push({ g: game, r: round, t: Date.now() })
  else if (rest.length === list.length) return // nothing to clear
  writeJson(KEY, rest.slice(-CAP))
}
