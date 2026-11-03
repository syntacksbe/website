import { useProfile } from './profile.js'
import Avatar from './Avatar.jsx'
import { GAMES } from './catalog.js'
import { LEVELS } from './format.js'
import { rankFor } from './progress.js'
import { typeInfo } from './types/registry.js'
import { fakePlayers, fakeTop, pointsFor } from './fakeLeaderboard.js'
import { weeklyChallenge } from './weekly.js'
import { countdown, useNow } from './time.js'
import { Stars } from './Player.jsx'
import './extras.css'

// The weekly challenge card (catalog and leaderboard) and the weekly leaderboard (#/leaderboard).
// The other players are placeholder data (fakeLeaderboard.js); the player's own row is real.

export function WeeklyCard({ progress, compact }) {
  const now = useNow(1000)
  const { week, game, ends, share } = weeklyChallenge(now)
  const players = fakePlayers(week.key, share)
  const stars = progress.starsOf(game)
  return (
    <section className={`ar-x-weekly${compact ? ' compact' : ''}`} aria-label="Weekly challenge">
      <div className="ar-x-weekly-top">
        <span className="ar-x-weekly-tag">🔥 Weekly challenge · week {week.week}</span>
        <span className="ar-x-weekly-clock" title="Ends Monday 00:00, Brussels time">⏳ {countdown(ends - now)}</span>
      </div>
      <strong className="ar-x-weekly-title">{game.title}</strong>
      <p className="ar-x-weekly-blurb">{game.blurb}</p>
      <div className="ar-x-weekly-foot">
        <span className="ar-tags">
          <span className="ar-type">{typeInfo(game.type).icon} {typeInfo(game.type).label}</span>
          <span className={`ar-level l${game.level}`}>{LEVELS[game.level]}</span>
          <Stars n={stars} />
        </span>
        <span className="ar-x-weekly-players">👥 {players.toLocaleString('en')} players this week</span>
      </div>
      <a className="btn btn-primary btn-sm" href={`#/play/${game.id}`}>{stars ? 'Beat your score' : 'Take the challenge'} →</a>
    </section>
  )
}

export default function Leaderboard({ progress }) {
  const now = useNow(1000)
  const { week, ends, share } = weeklyChallenge(now)
  const stars = GAMES.reduce((n, g) => n + progress.starsOf(g), 0)
  // Your row shows your character and first name from the profile, or "You".
  const profile = useProfile()
  const myName = profile.info.firstName.trim() || 'You'
  const myFace = <span className="ar-x-me-av"><Avatar look={profile.avatar} crop /></span>
  const me = { handle: myName, flag: myFace, stars, points: pointsFor(stars), me: true }
  const top = fakeTop(week.key)
  const players = fakePlayers(week.key, share)
  const above = top.filter((r) => r.points > me.points).length
  // Below the top 20, place the player in the rest of the field by how far they are behind #20.
  const rank = above < top.length ? above + 1 : Math.min(players, top.length + 1 + Math.round((top[top.length - 1].points - me.points) / 900))
  const rows = rank <= top.length ? [...top.slice(0, rank - 1), me, ...top.slice(rank - 1, top.length - 1)] : top

  return (
    <div className="container ar-x-page">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-x-head">
        <p className="kicker">Week {week.week} · resets in {countdown(ends - now)}</p>
        <h1>Weekly leaderboard</h1>
        <p>Points come from your stars. Earn more before Monday 00:00 (Brussels time) to climb.</p>
      </header>

      <div className="ar-x-board-wrap">
        <ol className="ar-x-board" aria-label={`Top ${top.length} this week`}>
          {rows.map((r, i) => (
            <li key={r.me ? 'me' : r.handle} className={`${r.me ? 'me' : ''}${i < 3 ? ` podium p${i + 1}` : ''}`}>
              <span className="ar-x-rank">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</span>
              <span className="ar-x-handle"><span aria-hidden="true">{r.flag}</span> {r.handle}{r.me && <small> · {rankFor(stars).name}</small>}</span>
              <span className="ar-x-stars">⭐ {r.stars}</span>
              <span className="ar-x-points">{r.points.toLocaleString('en')}</span>
            </li>
          ))}
          {rank > top.length && (
            <li className="me gap">
              <span className="ar-x-rank">#{rank.toLocaleString('en')}</span>
              <span className="ar-x-handle"><span aria-hidden="true">{myFace}</span> {myName}<small> · {rankFor(stars).name}</small></span>
              <span className="ar-x-stars">⭐ {stars}</span>
              <span className="ar-x-points">{me.points.toLocaleString('en')}</span>
            </li>
          )}
        </ol>
        <WeeklyCard progress={progress} compact />
      </div>
      <p className="ar-help ar-x-note">Demo standings: the other players are placeholders until online leaderboards go live. Your own row uses your real stars.</p>
    </div>
  )
}
