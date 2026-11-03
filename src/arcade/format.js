// The Arcade's game format. Every category lives in src/arcade/games/<category>.js and default-exports
//
//   { id, title, icon, blurb, games: [Game, …] }
//
// A Game is { id, title, blurb, type, level: 1 | 2 | 3, rounds: [Round, …] } plus what its type needs.
// `id` is kebab-case and unique across the Arcade; `blurb` is one short sentence for the catalog card.
// Levels: 1 = Rookie, 2 = Pro, 3 = Expert.
//
// Round shapes per type:
//   quiz   { q, code?, options: [2–4 strings], answer: index, why }
//   bug    { q, code: multi-line string, bug: line index (0-based) or [indexes], why }
//   order  { q, items: [3–6 strings in the CORRECT order], why }   (the game shuffles them)
//   sort   game-level `buckets: [2–3 strings]`; rounds are { text, bucket: index, why }
//   match  { q, pairs: [[left, right], …] (4–5 pairs) }
//   demo   no rounds; `demo` names a demo component ('limits', 'integration', 'datamodel', 'service', 'sales')
//   escape game-level `story` and `time` (seconds); every round is a lock of its own `type`
//          (any type above or a plug-in) with that type's fields, plus an optional `story` line
//   speed / hotseat  generated per category from its quiz rounds (see catalog.js), never written by hand
//
// More types are plug-ins in src/arcade/types/: <type>.check.js (label, icon, round count and a
// checkRound function, plain JS) plus <type>.jsx (the round component). Their games live in
// src/arcade/extra/<type>.js as { games: [{ category, …Game }] } and join their category in the catalog.

export const TYPES = {
  quiz: { label: 'Quiz', icon: '❓' },
  bug: { label: 'Spot the bug', icon: '🐞' },
  order: { label: 'Put in order', icon: '🔢' },
  sort: { label: 'Sort it', icon: '🗂️' },
  match: { label: 'Match pairs', icon: '🔗' },
  demo: { label: 'Simulation', icon: '🕹️' },
  escape: { label: 'Escape room', icon: '🔐' },
  speed: { label: 'Speed run', icon: '⏱️' },
  hotseat: { label: 'Hot seat', icon: '🔥' },
}

export const LEVELS = { 1: 'Rookie', 2: 'Pro', 3: 'Expert' }

const str = (v) => typeof v === 'string' && v.trim().length > 0
const ROUNDS = { quiz: [4, 10], bug: [4, 10], order: [3, 8], sort: [6, 14], match: [2, 5], escape: [3, 6] }

// Returns a list of problems (empty when the category is valid). `extra` holds the plug-in types.
export function check(category, seen = new Set(), extra = {}) {
  const errors = []
  const err = (where, msg) => errors.push(`${where}: ${msg}`)
  for (const k of ['id', 'title', 'icon', 'blurb']) if (!str(category?.[k])) err(category?.id ?? 'category', `missing ${k}`)
  if (!Array.isArray(category?.games)) return [...errors, 'games must be an array']

  for (const g of category.games) {
    const at = `${category.id}/${g.id}`
    if (!str(g.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id)) err(at, 'id must be kebab-case')
    if (seen.has(g.id)) err(at, 'duplicate id')
    seen.add(g.id)
    for (const k of ['title', 'blurb']) if (!str(g[k])) err(at, `missing ${k}`)
    if (!TYPES[g.type] && !extra[g.type]) err(at, `unknown type ${g.type}`)
    if (![1, 2, 3].includes(g.level)) err(at, 'level must be 1, 2 or 3')
    if (g.type === 'demo') {
      if (!['limits', 'integration', 'datamodel', 'service', 'sales'].includes(g.demo)) err(at, 'unknown demo')
      continue
    }
    const [min, max] = ROUNDS[g.type] ?? extra[g.type]?.rounds ?? [1, 99]
    if (!Array.isArray(g.rounds) || g.rounds.length < min || g.rounds.length > max) {
      err(at, `needs ${min}–${max} rounds`)
      continue
    }
    if (g.type === 'escape' && (!str(g.story) || !(g.time >= 60 && g.time <= 600))) err(at, 'escape needs a story and a time of 60–600 s')
    if (g.type === 'sort' && (!Array.isArray(g.buckets) || g.buckets.length < 2 || g.buckets.length > 3 || !g.buckets.every(str))) err(at, 'sort needs 2–3 buckets')

    g.rounds.forEach((r, i) => {
      const where = `${at}#${i + 1}`
      // In an escape room every lock carries its own type (and buckets for a sort lock).
      const type = g.type === 'escape' ? r.type : g.type
      const buckets = r.buckets ?? g.buckets
      if (g.type === 'escape' && !(ROUNDS[type] || extra[type]) ) return err(where, `unknown lock type ${type}`)
      if (extra[type]) {
        if (!str(r.why)) err(where, 'missing why')
        for (const e of extra[type].checkRound(r, g) ?? []) err(where, e)
        return
      }
      if (type !== 'match' && !str(r.why)) err(where, 'missing why')
      if (type === 'quiz') {
        if (!str(r.q)) err(where, 'missing q')
        if (!Array.isArray(r.options) || r.options.length < 2 || r.options.length > 4 || !r.options.every(str)) err(where, 'needs 2–4 options')
        else if (!Number.isInteger(r.answer) || r.answer < 0 || r.answer >= r.options.length) err(where, 'answer out of range')
        if (r.code != null && !str(r.code)) err(where, 'code must be a string')
      }
      if (type === 'bug') {
        if (!str(r.q) || !str(r.code)) err(where, 'needs q and code')
        else {
          const lines = r.code.split('\n').length
          const bugs = [].concat(r.bug)
          if (!bugs.length || !bugs.every((b) => Number.isInteger(b) && b >= 0 && b < lines)) err(where, `bug line out of range (code has ${lines} lines)`)
        }
      }
      if (type === 'order') {
        if (!str(r.q)) err(where, 'missing q')
        if (!Array.isArray(r.items) || r.items.length < 3 || r.items.length > 6 || !r.items.every(str)) err(where, 'needs 3–6 items')
        else if (new Set(r.items).size !== r.items.length) err(where, 'items must be unique')
      }
      if (type === 'sort') {
        if (!Array.isArray(buckets) || buckets.length < 2) err(where, 'sort needs buckets')
        if (!str(r.text)) err(where, 'missing text')
        if (!Number.isInteger(r.bucket) || r.bucket < 0 || r.bucket >= (buckets?.length ?? 0)) err(where, 'bucket out of range')
      }
      if (type === 'match') {
        if (!str(r.q)) err(where, 'missing q')
        if (!Array.isArray(r.pairs) || r.pairs.length < 4 || r.pairs.length > 5) err(where, 'needs 4–5 pairs')
        else {
          if (!r.pairs.every((p) => Array.isArray(p) && p.length === 2 && p.every(str))) err(where, 'pairs must be [left, right] strings')
          if (new Set(r.pairs.map((p) => p[0])).size !== r.pairs.length || new Set(r.pairs.map((p) => p[1])).size !== r.pairs.length) err(where, 'pair sides must be unique')
        }
      }
    })
  }
  return errors
}
