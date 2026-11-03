import { readGta } from '../gta/store.js'
import { PART_ITEMS, partItemId, slotById } from './avatarParts.js'
import { loadProfile } from './profile.js'

// The Arcade shop's items, kept apart from shop.js so the radio (also on the homepage) can check unlocked stations
// without loading the Arcade catalog. Names and texts are English, like the rest of the Arcade.
// `free` items are owned from the start; `gift` comes free with a side quest (the Konami code).
export const ITEMS = [
  { id: 'bg-standard', kind: 'background', look: 'standard', name: 'Standard', text: 'The Arcade as it comes.', price: 0 },
  { id: 'bg-grid', kind: 'background', look: 'grid', name: 'Blueprint grid', text: 'A faint drafting grid, for architects.', price: 100 },
  { id: 'bg-scanlines', kind: 'background', look: 'scanlines', name: 'Scanlines', text: 'An old arcade cabinet screen.', price: 150 },
  { id: 'bg-teal', kind: 'background', look: 'teal', name: 'Miami teal', text: 'A cool teal wash from the top.', price: 200 },
  { id: 'bg-sunset', kind: 'background', look: 'sunset', name: 'Sunset strip', text: 'Orange sky fading down the page.', price: 250 },
  { id: 'bg-gold', kind: 'background', look: 'gold', name: 'Gold rush', text: 'A warm gold glow, for top players.', price: 400 },
  { id: 'border-classic', kind: 'border', look: 'classic', name: 'Classic', text: 'Clean cards.', price: 0 },
  { id: 'border-neon', kind: 'border', look: 'neon', name: 'Neon glow', text: 'Cards that glow in your accent colour.', price: 150 },
  { id: 'border-stripe', kind: 'border', look: 'stripe', name: 'Racing stripe', text: 'A thick stripe down the left edge.', price: 200 },
  { id: 'border-flames', kind: 'border', look: 'flames', name: 'Flames', text: 'Hot edges at the bottom of every card.', price: 300 },
  { id: 'border-holo', kind: 'border', look: 'holo', name: 'Holo foil', text: 'A rainbow foil edge.', price: 450 },
  { id: 'border-gold', kind: 'border', look: 'gold', name: 'Gold trim', text: 'Double gold edges. Also a cheat code reward.', price: 600, gift: 'konami' },
  { id: 'radio-sunset', kind: 'radio', station: 'sunset', name: 'Sunset Strip 92.5', text: 'Outrun-style synthwave on the radio.', price: 250 },
  { id: 'radio-heist', kind: 'radio', station: 'heist', name: 'Heist FM 96.3', text: 'Tense synths for go-live night.', price: 400 },
  // Clothes, hair and accessories for the character, and cars, paint and rims for the garage (avatarParts.js).
  ...PART_ITEMS,
]

export const KINDS = [
  { id: 'outfit', title: 'Clothes & style', note: 'For your character on the profile page. Try them on there before you buy.' },
  { id: 'car', title: 'Garage', note: 'Cars, paint and rims for the car parked next to your character.' },
  { id: 'background', title: 'Backgrounds', note: 'The Arcade page behind the games. Works in the day, sunset and night themes.' },
  { id: 'border', title: 'Card borders', note: 'On every game card in the catalog and around the game you play.' },
  { id: 'radio', title: 'Radio stations', note: 'Extra stations on the FM dial in the header.' },
]

export const itemById = (id) => ITEMS.find((i) => i.id === id)

// Whether a character or garage option can be used: free, or bought in the shop.
export function ownsPart(profile, slot, id) {
  const o = slotById(slot)?.options.find((x) => x.id === id)
  return !o?.price || profile.shop.owned.includes(partItemId(slot, id))
}

export function owns(profile, item) {
  if (item.price === 0 || profile.shop.owned.includes(item.id)) return true
  return Boolean(item.gift && readGta().quests.includes(item.gift))
}

// Bought radio stations show on the dial; the pirate station is a side quest instead.
export function stationUnlocked(id) {
  if (id === 'pirate') return readGta().quests.includes('pirate')
  const item = ITEMS.find((i) => i.station === id)
  return !item || owns(loadProfile(), item)
}
