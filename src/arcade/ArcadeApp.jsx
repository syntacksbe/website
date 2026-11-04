import { useEffect, useState } from 'react'
import { GameProvider } from '../game.jsx'
import { useDayNight } from '../useDayNight.js'
import Footer from '../components/Footer.jsx'
import Toasts from '../components/Toasts.jsx'
import RadioDial from '../components/RadioDial.jsx'
import Logo from '../components/Logo.jsx'
import { MenuButton, PatchNotesMenu, SITE_LINKS, patchNotesLinks } from '../components/Nav.jsx'
import Catalog from './Catalog.jsx'
import Player from './Player.jsx'
import Daily from './Daily.jsx'
import { PathMap, Paths } from './Paths.jsx'
import Review from './Review.jsx'
import Leaderboard from './Leaderboard.jsx'
import Trophies from './Trophies.jsx'
import Shop from './Shop.jsx'
import Profile from './Profile.jsx'
import { gearsText, useShop } from './shop.js'
import { fullName } from './profile.js'
import Avatar from './Avatar.jsx'
import './shop.css'
import { GAMES, gameById } from './catalog.js'
import { pathById } from './paths.js'
import { useProgress } from './progress.js'
import { setSound, soundOn } from './fx.js'
import GtaLayer, { GtaMenuItems } from '../gta/GtaLayer.jsx'

const PAGES = { daily: 'Daily Sforcle', paths: 'Learning paths', review: 'Review your misses', leaderboard: 'Weekly leaderboard', trophies: 'Trophy cabinet', shop: 'Shop', profile: 'Your profile' }

// Routes live in the hash so the page works as static files: #/ is the catalog
// (#/?c=cpq opens it filtered on a category), #/play/<game-id> plays a game (?path=<id> when it's
// played from a learning path), #/path/<id> shows one path, and #/daily, #/paths, #/review,
// #/leaderboard, #/trophies, #/shop and #/profile are pages of their own.
function readHash() {
  const [path, query] = window.location.hash.replace(/^#/, '').split('?')
  const params = new URLSearchParams(query)
  const play = path.match(/^\/play\/([\w-]+)/)
  const road = path.match(/^\/path\/([\w-]+)/)
  const page = road ? 'path' : PAGES[path.slice(1)] ? path.slice(1) : null
  return { game: play ? gameById(play[1]) : null, page, pathId: road?.[1] ?? params.get('path'), category: params.get('c') }
}

function useRoute() {
  const [route, setRoute] = useState(readHash)
  useEffect(() => {
    const onHash = () => setRoute(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

function Arcade() {
  const route = useRoute()
  const progress = useProgress()
  const [filter, setFilter] = useState({ category: route.category, level: null })

  // A category link (from a game's breadcrumb) opens the catalog filtered on it.
  useEffect(() => {
    if (!route.game && !route.page) setFilter((f) => ({ ...f, category: route.category }))
  }, [route.game, route.page, route.category])

  useEffect(() => {
    const name = route.game?.title ?? (route.page === 'path' ? pathById(route.pathId)?.title : PAGES[route.page])
    document.title = name ? `${name} · Syntacks Arcade` : 'Syntacks Arcade — Learn Salesforce by playing'
    if (route.page) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route.game, route.page, route.pathId])

  const stars = GAMES.reduce((n, g) => n + progress.starsOf(g), 0)
  // Gears, the equipped look and the player's character, from the profile (profile.js, shop.js).
  const shop = useShop(progress)
  const { background, border } = shop.equipped
  const me = shop.profile.info
  useEffect(() => {
    const html = document.documentElement
    html.dataset.arcadeBg = background
    html.dataset.arcadeBorder = border
    return () => {
      delete html.dataset.arcadeBg
      delete html.dataset.arcadeBorder
    }
  }, [background, border])
  // The profile page can switch the sound too.
  useEffect(() => {
    const sync = () => setSoundState(soundOn())
    window.addEventListener('syntacks-sound', sync)
    return () => window.removeEventListener('syntacks-sound', sync)
  }, [])
  const [sound, setSoundState] = useState(soundOn)
  const toggleSound = () => {
    setSound(!sound)
    setSoundState(!sound)
  }

  return (
    <>
      <header className="nav ar-nav" id="top">
        <div className="container nav-inner">
          <a href="../" className="logo" aria-label="Syntacks home">
            <Logo />
          </a>
          <nav className="nav-links" aria-label="Main">
            {SITE_LINKS.map((l) => {
              const arcade = l.href === 'arcade/'
              if (l.href === 'blog/') return <PatchNotesMenu key={l.href} base="../" />
              return (
                <a key={l.href} href={arcade ? '#/' : `../${l.href}`} className={l.minor ? 'minor' : undefined} aria-current={arcade ? 'page' : undefined}>
                  {l.label}
                </a>
              )
            })}
          </nav>
          <div className="nav-right">
            <button type="button" className="ar-sound" onClick={toggleSound} aria-pressed={sound} title={sound ? 'Sound effects on' : 'Sound effects off'}>
              {sound ? '🔊' : '🔇'}
            </button>
            <RadioDial />
            <a
              href="#/trophies" className="ar-trophy" title={`Trophy cabinet · ${shop.trophies} trophies · ⭐ ${stars} stars`}
              aria-label={`Trophy cabinet, ${shop.trophies} trophies`} aria-current={route.page === 'trophies' ? 'page' : undefined}
            >
              <span aria-hidden="true">🏆</span>
              <b key={shop.trophies}>{shop.trophies}</b>
            </a>
            <a
              href="#/shop" className="ar-trophy ar-gears" title="Your gears: open the shop"
              aria-label={`Shop, ${shop.gears} gears`} aria-current={route.page === 'shop' ? 'page' : undefined}
            >
              <span aria-hidden="true">⚙</span>
              <b key={shop.gears}>{shop.gears.toLocaleString('en-US')}</b>
            </a>
            <a href="#/profile" className="ar-avatar" title={fullName(me) ? `${fullName(me)}: your profile` : 'Your profile'} aria-label="Your profile">
              <Avatar look={shop.profile.avatar} crop />
            </a>
            <a href="../#contact" className="btn btn-primary btn-sm">Let's talk</a>
            <MenuButton links={[
              ...patchNotesLinks(SITE_LINKS.map((l) => (l.href === 'arcade/' ? { ...l, href: '#/', current: true } : { ...l, href: `../${l.href}` })), '../'),
              { href: '#/shop', label: `Shop · ${gearsText(shop.gears)}` },
              { href: '#/profile', label: 'Your profile' },
            ]}>
              <GtaMenuItems page="arcade" />
            </MenuButton>
          </div>
        </div>
      </header>
      <main className="ar-main">
        {route.game ? (
          <Player game={route.game} progress={progress} pathId={route.pathId} key={`${route.game.id}-${route.pathId}`} />
        ) : route.page === 'daily' ? (
          <Daily />
        ) : route.page === 'paths' ? (
          <Paths progress={progress} />
        ) : route.page === 'path' ? (
          <PathMap path={pathById(route.pathId)} progress={progress} key={route.pathId} />
        ) : route.page === 'review' ? (
          <Review />
        ) : route.page === 'leaderboard' ? (
          <Leaderboard progress={progress} />
        ) : route.page === 'trophies' ? (
          <Trophies progress={progress} />
        ) : route.page === 'shop' ? (
          <Shop progress={progress} />
        ) : route.page === 'profile' ? (
          <Profile progress={progress} />
        ) : (
          <Catalog progress={progress} filter={filter} setFilter={setFilter} />
        )}
      </main>
    </>
  )
}

export default function ArcadeApp() {
  const clock = useDayNight()
  return (
    <GameProvider>
      <Arcade />
      <Footer clock={clock} />
      <Toasts />
      <GtaLayer page="arcade" />
    </GameProvider>
  )
}
