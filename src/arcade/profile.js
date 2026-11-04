import { useSyncExternalStore } from 'react'
import { DEFAULT_AVATAR, DEFAULT_GARAGE } from './avatarParts.js'

// The player's profile: personal info, their character and car (avatarParts.js), what they bought in the Arcade shop
// and what they have equipped.
// For now it lives in this browser (localStorage). Everything goes through loadProfile / saveProfile /
// clearProfile, so swapping them for calls to a database later changes only this file.
const KEY = 'syntacks-profile-v1'
const EVENT = 'syntacks-profile'

export const EMPTY_PROFILE = {
  info: { firstName: '', lastName: '', role: '', company: '' },
  avatar: DEFAULT_AVATAR,
  garage: DEFAULT_GARAGE,
  shop: { spent: 0, owned: [], equipped: { background: 'standard', border: 'classic' } },
  // keyboard: which letters stand in for "previous / next" (Q and E on QWERTY, A and E on AZERTY, arrows only
  // for anything else); 'auto' asks the browser where it can (Chrome) and falls back to QWERTY.
  settings: { keyboard: 'auto' },
  updatedAt: null,
}

let cache = null

function merge(base, saved) {
  const s = saved && typeof saved === 'object' ? saved : {}
  return {
    info: { ...base.info, ...(s.info || {}) },
    avatar: { ...base.avatar, ...(s.avatar || {}) },
    garage: { ...base.garage, ...(s.garage || {}) },
    shop: { ...base.shop, ...(s.shop || {}), equipped: { ...base.shop.equipped, ...(s.shop?.equipped || {}) } },
    settings: { ...base.settings, ...(s.settings || {}) },
    updatedAt: s.updatedAt ?? null,
  }
}

export function loadProfile() {
  if (cache) return cache
  try {
    cache = merge(EMPTY_PROFILE, JSON.parse(localStorage.getItem(KEY) || '{}'))
  } catch {
    cache = merge(EMPTY_PROFILE, {})
  }
  return cache
}

// Saves a change: `info`, `avatar`, `garage`, `shop` and `settings` are merged one level deep (shop.equipped too).
export function saveProfile(patch) {
  const now = loadProfile()
  const p = typeof patch === 'function' ? patch(now) : patch
  cache = merge(EMPTY_PROFILE, {
    info: { ...now.info, ...(p.info || {}) },
    avatar: { ...now.avatar, ...(p.avatar || {}) },
    garage: { ...now.garage, ...(p.garage || {}) },
    shop: { ...now.shop, ...(p.shop || {}), equipped: { ...now.shop.equipped, ...(p.shop?.equipped || {}) } },
    settings: { ...now.settings, ...(p.settings || {}) },
    updatedAt: new Date().toISOString(),
  })
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // No storage (private mode): the profile lasts for this visit only.
  }
  window.dispatchEvent(new Event(EVENT))
  return cache
}

export function clearProfile() {
  cache = merge(EMPTY_PROFILE, {})
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(fn) {
  const onStorage = (e) => {
    if (e.key !== KEY) return
    cache = null
    fn()
  }
  window.addEventListener(EVENT, fn)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, fn)
    window.removeEventListener('storage', onStorage)
  }
}

export function useProfile() {
  return useSyncExternalStore(subscribe, loadProfile)
}

export const fullName = (info) => [info.firstName, info.lastName].map((s) => s.trim()).filter(Boolean).join(' ')
export const initials = (info) => [info.firstName, info.lastName].map((s) => s.trim()[0] ?? '').join('').toUpperCase()

// Keyboard layouts the profile can choose, and the "previous / next" letters each one uses next to the arrow keys.
export const KEYBOARDS = [
  ['auto', 'Detect', 'Asks the browser; QWERTY when it can\'t tell.'],
  ['qwerty', 'QWERTY', 'Q and E, like the games.'],
  ['azerty', 'AZERTY', 'A and E: Q sits where A is in Belgium and France.'],
  ['other', 'Other', 'Arrow keys only.'],
]
export const NAV_KEYS = { qwerty: ['q', 'e'], azerty: ['a', 'e'], other: [null, null] }

// The layout to use: the chosen one, or for 'auto' what the Keyboard API says (Chrome only), else QWERTY.
export async function resolveKeyboard() {
  const chosen = loadProfile().settings.keyboard
  if (chosen && chosen !== 'auto') return chosen
  try {
    const map = await navigator.keyboard.getLayoutMap()
    return map.get('KeyQ') === 'a' ? 'azerty' : 'qwerty'
  } catch {
    return 'qwerty'
  }
}
