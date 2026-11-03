import { addTo, signal } from './store.js'
import { GTA_TEXT } from './strings.js'

// Side quests ("strangers and freaks"): easter eggs marked with a "?" blip on the radar and the pause map
// until they're done. `spot` is the section the blip sits at, `x` its place left or right of the main road.
// Each one pays RP.quest (economy.js); the Konami code also unlocks the gold border in the Arcade shop. Their names and hints are GTA_TEXT.<lang>.quests.
export const QUESTS = [
  { id: 'konami', spot: 'experience', x: 40 }, // the Konami code, anywhere (or as a cheat in the pause menu)
  { id: 'pirate', spot: 'top', x: -40 }, // tune past the last station on the radio
  { id: 'lockpick', spot: 'certifications', x: 40 }, // click the locked card five times
  { id: 'tourist', spot: 'approach', x: -44 }, // fast-travel to four districts from the pause map
  { id: 'heat', spot: 'health-check', x: -40 }, // win the police chase
]

const lang = () => document.documentElement.lang?.slice(0, 2) || 'en'

// Marks a quest done once and shows the "side quest complete" banner.
export function completeQuest(id) {
  if (!QUESTS.some((q) => q.id === id) || !addTo('quests', id)) return false
  const T = (GTA_TEXT[lang()] ?? GTA_TEXT.en).quests
  banner({ kicker: T.banner, title: T[id][0], line: T.reward, tone: 'pass' })
  return true
}

// Queues a big GTA-style banner (Banners.jsx shows them one at a time).
// tone: 'pass' (side quest complete, heat lost), 'cheat'.
export function banner(b) {
  signal('banner', { id: `${Date.now()}-${Math.random()}`, ...b })
}

export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

// Cheats typed in the pause menu settings: the Konami code spelled out, for phones and anyone without arrow keys.
export function cheat(code) {
  const c = code.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (c === 'uuddlrlrba' || c === 'upupdowndownleftrightleftrightba') {
    const T = (GTA_TEXT[lang()] ?? GTA_TEXT.en).quests
    banner({ kicker: T.cheat[0], title: 'Gold trim', line: T.cheat[1], tone: 'cheat' })
    completeQuest('konami')
    return true
  }
  return false
}
