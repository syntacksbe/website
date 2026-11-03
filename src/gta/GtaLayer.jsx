import { useEffect } from 'react'
import Banners from './Banners.jsx'
import Chase from './Chase.jsx'
import PauseMenu from './PauseMenu.jsx'
import RankUp from './RankUp.jsx'
import Wheels from './Wheels.jsx'
import { KONAMI, cheat } from './quests.js'
import { signal } from './store.js'
import { useGtaText } from './text.js'
import './gta.css'

// The GTA layer on top of a page: pause menu, wheels, rank-up, banners, and on the homepage also the police chase. `page` is 'home' or 'arcade'.
export default function GtaLayer({ page }) {
  useEffect(() => {
    let at = 0
    const onKey = (e) => {
      const want = KONAMI[at]
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      at = key === want ? at + 1 : key === KONAMI[0] ? 1 : 0
      if (at === KONAMI.length) {
        at = 0
        cheat('uuddlrlrba')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <PauseMenu page={page} />
      <Wheels page={page} />
      <RankUp />
      <Banners />
      {page === 'home' && <Chase />}
    </>
  )
}

// Menu-panel entries for phones, where there's no keyboard: the pause menu and the wheels.
export function GtaMenuItems({ page }) {
  const T = useGtaText()
  return (
    <span className="gta-menu-items">
      <button type="button" onClick={() => signal('pause', 'map')}>🗺️ {T.pause.open}</button>
      <button type="button" onClick={() => signal('wheel', 'tools')}>🔧 {T.wheel.tools}</button>
      {page === 'home' && <button type="button" onClick={() => signal('wheel', 'character')}>⟳ {T.wheel.character}</button>}
    </span>
  )
}
