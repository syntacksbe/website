import { CATEGORIES, GAMES } from './catalog.js'
import { PATHS } from './paths.js'
import { wordFor } from './daily-words.js'
import { feats, readJson } from './store.js'

// Arcade trophies, all computed from saved progress: best stars per game, Sforcle days and feats
// (src/arcade/store.js). Homepage badges come from ACHIEVEMENTS in src/game.jsx.

// Longest run of consecutive Sforcle days won (the saved streak resets on a loss).
function sforcleBest() {
  const save = readJson('syntacks-sforcle', {})
  const won = Object.entries(save.days ?? {})
    .map(([ymd, d]) => ({ n: Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86400000) - 20453, guesses: d?.guesses ?? [] }))
    .filter((d) => d.guesses.includes(wordFor(d.n).word))
    .map((d) => d.n)
    .sort((a, b) => a - b)
  let best = 0
  let run = 0
  won.forEach((n, i) => {
    run = i && n === won[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return { wins: won.length, best: Math.max(best, save.streak ?? 0) }
}

const pathDone = (path, starsOf, byId) => path.games.every((id) => byId[id] && starsOf(byId[id]) > 0)

export const TROPHIES = [
  { id: 'first-star', icon: '🪙', title: 'Insert coin', text: 'Earn your first star', test: (s) => s.stars > 0 },
  { id: 'flawless', icon: '🌟', title: 'Flawless', text: 'Get 3 stars on any game', test: (s) => s.gold > 0 },
  { id: 'ten-games', icon: '🕹️', title: 'Regular', text: 'Play 10 different games', test: (s) => s.played >= 10, goal: (s) => [s.played, 10] },
  { id: 'fifty-games', icon: '🐀', title: 'Arcade rat', text: 'Play 50 different games', test: (s) => s.played >= 50, goal: (s) => [s.played, 50] },
  { id: 'hundred-stars', icon: '💯', title: 'Century', text: 'Collect 100 stars', test: (s) => s.stars >= 100, goal: (s) => [s.stars, 100] },
  { id: 'star-hoarder', icon: '🌌', title: 'Star hoarder', text: 'Collect 250 stars', test: (s) => s.stars >= 250, goal: (s) => [s.stars, 250] },
  { id: 'tourist', icon: '🧭', title: 'Tourist', text: 'Play a game in every category', test: (s) => s.categories === CATEGORIES.length, goal: (s) => [s.categories, CATEGORIES.length] },
  { id: 'category-king', icon: '👑', title: 'Category king', text: 'Get 3 stars on every game of one category', test: (s) => s.goldCategory },
  { id: 'road-warrior', icon: '🛣️', title: 'Road warrior', text: 'Finish a learning path', test: (s) => s.paths > 0 },
  { id: 'every-road', icon: '🗺️', title: 'Every road', text: 'Finish every learning path', test: (s) => s.paths === PATHS.length, goal: (s) => [s.paths, PATHS.length] },
  { id: 'boss-slayer', icon: '⚔️', title: 'Boss slayer', text: 'Win a boss fight', test: (s) => s.bosses > 0 },
  { id: 'great-escape', icon: '🔓', title: 'The great escape', text: 'Escape every escape room', test: (s) => s.escapes === s.escapeTotal, goal: (s) => [s.escapes, s.escapeTotal] },
  { id: 'millionaire', icon: '🪜', title: 'Top of the ladder', text: 'Reach 1,000,000 points in a hot seat', test: (s) => s.millionaire },
  { id: 'wordsmith', icon: '🟩', title: 'Wordsmith', text: 'Solve a Daily Sforcle', test: (s) => s.sforcle.wins > 0 },
  { id: 'on-fire', icon: '🔥', title: 'On fire', text: 'Win the Sforcle 7 days in a row', test: (s) => s.sforcle.best >= 7, goal: (s) => [s.sforcle.best, 7] },
]

// Everything the trophies test, from the player's progress (useProgress).
export function trophyStats(progress) {
  const { starsOf, played } = progress
  const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]))
  const escapes = GAMES.filter((g) => g.type === 'escape')
  return {
    stars: GAMES.reduce((n, g) => n + starsOf(g), 0),
    gold: GAMES.filter((g) => starsOf(g) === 3).length,
    played: GAMES.filter(played).length,
    categories: CATEGORIES.filter((c) => c.games.some(played)).length,
    goldCategory: CATEGORIES.some((c) => c.games.every((g) => starsOf(g) === 3)),
    paths: PATHS.filter((p) => pathDone(p, starsOf, byId)).length,
    bosses: (feats().boss ?? []).length,
    escapes: escapes.filter((g) => starsOf(g) > 0).length,
    escapeTotal: escapes.length,
    millionaire: GAMES.some((g) => g.type === 'hotseat' && starsOf(g) === 3),
    sforcle: sforcleBest(),
  }
}

export function trophies(progress) {
  const stats = trophyStats(progress)
  return TROPHIES.map((t) => ({ ...t, earned: Boolean(t.test(stats)), goal: t.goal?.(stats) }))
}
