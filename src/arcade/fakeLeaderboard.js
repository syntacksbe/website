// PLACEHOLDER DATA until the Arcade has a backend: every handle, score and player count below is
// made up. The rows are generated per ISO week from a seed, so they stay the same all week and
// change on Monday. Only the player's own row (inserted by Leaderboard.jsx) uses real progress.
import { seeded } from './time.js'

const HANDLES = [
  'BulkifyOrBust', 'GovernorGhost', 'SoqlSamurai', 'TriggerHappy99', 'QueueableKing', 'CalloutCobra',
  'DmlDragon', 'LimitBreaker77', 'NeonNamespace', 'SharingShark', 'PicklistPhantom', 'RollbackRaider',
  'HeapHunter', 'CronCrusader', 'SchemaShogun', 'UpsertUnicorn', 'ExternalIdEagle', 'BatchBandit',
  'MetadataMaverick', 'WaterfallWolf', 'SlaSlayer', 'CpuTimeCowboy', 'LookupLynx', 'AsyncAce',
  'NeverDeployFriday', 'SandboxSniper', 'FlowStateFox', 'ApexPredator', 'NullCheckNinja', 'RecordLockRebel',
]

const FLAGS = ['🇧🇪', '🇳🇱', '🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇵🇱', '🇵🇹', '🇮🇪', '🇸🇪', '🇨🇭', '🇦🇹']

// Points for a star total. The player's own row uses the same formula without the noise.
export const pointsFor = (stars, noise = 0) => Math.round(stars * 1150 + noise)

// The fake weekly top 20: [{ handle, flag, stars, points }], best first.
export function fakeTop(weekKey) {
  const rand = seeded(`board-${weekKey}`)
  const handles = [...HANDLES]
  for (let i = handles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[handles[i], handles[j]] = [handles[j], handles[i]]
  }
  return handles
    .slice(0, 20)
    .map((handle, i) => {
      const stars = Math.round(410 * 0.92 ** i + rand() * 14)
      return { handle, flag: FLAGS[Math.floor(rand() * FLAGS.length)], stars, points: pointsFor(stars, rand() * 2400) }
    })
    .sort((a, b) => b.points - a.points)
}

// "1,284 players this week": a weekly base that grows as the week goes on (share: 0–1).
export function fakePlayers(weekKey, share) {
  const rand = seeded(`players-${weekKey}`)
  return Math.round(620 + rand() * 380 + share * (520 + rand() * 260))
}
