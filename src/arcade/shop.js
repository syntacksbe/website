import { GAMES } from './catalog.js'
import { loadProfile, saveProfile, useProfile } from './profile.js'
import { slotById } from './avatarParts.js'
import { owns } from './shopItems.js'
import { trophies } from './trophies.js'

export { ITEMS, KINDS, itemById, owns, ownsPart, stationUnlocked } from './shopItems.js'

// The Arcade shop. Gears (⚙) are earned only by playing the Arcade: 10 per star and 50 per trophy. They are a game
// score, not money. Items change how the Arcade looks (page background, borders on the game cards and the game
// panel), dress the character or upgrade the car on the profile, or add a radio station. Purchases and the equipped look are saved in the profile (profile.js).
export const GEARS_PER_STAR = 10
export const GEARS_PER_TROPHY = 50

export function gearsEarned(progress) {
  const stars = GAMES.reduce((n, g) => n + progress.starsOf(g), 0)
  const won = trophies(progress).filter((t) => t.earned).length
  return { stars, trophies: won, earned: stars * GEARS_PER_STAR + won * GEARS_PER_TROPHY }
}

// Gears to spend, plus buy and equip. Needs the Arcade's progress (useProgress).
export function useShop(progress) {
  const profile = useProfile()
  const { earned, stars, trophies: won } = gearsEarned(progress)
  const gears = Math.max(0, earned - profile.shop.spent)
  const equipped = profile.shop.equipped
  // Character and garage parts are "equipped" when the profile uses them; looks when the Arcade shows them.
  const isEquipped = (item) => (item.slot ? profile[slotById(item.slot).store][item.slot] === item.value : item.look && equipped[item.kind] === item.look)
  const equip = (item) => {
    if (!owns(loadProfile(), item)) return
    if (item.slot) saveProfile({ [slotById(item.slot).store]: { [item.slot]: item.value } })
    else if (item.look) saveProfile({ shop: { equipped: { [item.kind]: item.look } } })
  }
  const buy = (item) => {
    const p = loadProfile()
    if (owns(p, item) || gears < item.price) return false
    saveProfile({ shop: { spent: p.shop.spent + item.price, owned: [...p.shop.owned, item.id] } })
    equip(item)
    return true
  }
  return { gears, earned, stars, trophies: won, spent: profile.shop.spent, profile, equipped, owns: (i) => owns(profile, i), isEquipped, buy, equip }
}

export const gearsText = (n) => `⚙ ${Math.round(n).toLocaleString('en-US')}`
