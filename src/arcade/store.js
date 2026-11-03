// Small localStorage helpers for the Arcade. Storage can be unavailable (private mode), so every
// read falls back and every write is allowed to fail: progress then lasts for this visit only.
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore: see above.
  }
}

// Feats the stars alone don't show (a boss beaten), for the trophy cabinet: { boss: [game ids] }.
const FEATS = 'syntacks-arcade-feats'

export const feats = () => readJson(FEATS, {})

export function noteFeat(kind, id) {
  const all = feats()
  const list = all[kind] ?? []
  if (!list.includes(id)) writeJson(FEATS, { ...all, [kind]: [...list, id] })
}
