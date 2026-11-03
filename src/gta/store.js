import { useSyncExternalStore } from 'react'

// The GTA layer's saved state, shared by the homepage and the Arcade: side quests done, the chosen character,
// the heist crew, the heat level and a few counters. (Gears, purchases and personal info live in the Arcade
// profile: src/arcade/profile.js.) Clear localStorage key `syntacks-gta-v1` to reset it.
const KEY = 'syntacks-gta-v1'
const EVENT = 'syntacks-gta'

const DEFAULT = {
  quests: [], // side quest ids (quests.js)
  persona: 'developer',
  crew: null, // { admin, lead, users } once a crew was assembled
  heat: 0, // wanted points already "lost": stars count from here (see useWanted in game.jsx)
  travels: [], // districts reached through the pause map
  seenRank: 0, // last rank the rank-up screen showed
}

let cache = null

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...DEFAULT, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch {
    return { ...DEFAULT }
  }
}

export function readGta() {
  cache ??= load()
  return cache
}

// Merges a patch (an object, or a function of the current state) and tells every hook.
export function writeGta(patch) {
  const now = readGta()
  const next = { ...now, ...(typeof patch === 'function' ? patch(now) : patch) }
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // No storage (private mode): the state lasts for this visit only.
  }
  window.dispatchEvent(new Event(EVENT))
}

// Adds a value to a list in the state once; returns true when it was new.
export function addTo(list, value) {
  if (readGta()[list].includes(value)) return false
  writeGta((s) => ({ [list]: [...s[list], value] }))
  return true
}

export function resetGta() {
  cache = { ...DEFAULT }
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

export function useGtaState() {
  return useSyncExternalStore(subscribe, readGta)
}

// Small page-wide signals between the pieces (open the pause menu, a wheel, the customs garage...).
export function signal(name, detail) {
  window.dispatchEvent(new CustomEvent(`gta:${name}`, { detail }))
}

export function onSignal(name, fn) {
  const handler = (e) => fn(e.detail)
  window.addEventListener(`gta:${name}`, handler)
  return () => window.removeEventListener(`gta:${name}`, handler)
}

// Whether a key press should be left alone: typing in a field, or with a modifier held.
export function typing(e) {
  const el = e.target
  return e.ctrlKey || e.metaKey || e.altKey || Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'))
}
