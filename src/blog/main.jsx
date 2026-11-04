import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { GameProvider } from '../game.jsx'
import { useDayNight } from '../useDayNight.js'
import Footer from '../components/Footer.jsx'
import Toasts from '../components/Toasts.jsx'
import BlogNav from './BlogNav.jsx'
import DeckLaunch from './Deck.jsx'
import { setupTabs } from './tabs.js'
import '../styles.css'
import './blog.css'

setupTabs()

// The patch-notes pages are static HTML (built by scripts/build-blog.mjs) so search engines read the article
// as is. React only adds the chrome around it: the header above the article and the footer below, plus the
// card-deck button in a post's header (Deck.jsx), through portals into placeholder divs, from one root so they
// share the game state (toasts, radio).
// The GTA layer stays off here: its links and fast travel are written for the homepage and the Arcade.
// Only posts have a deck; the list of releases has no #deck-launch.
const deckSpot = document.getElementById('deck-launch')

function Chrome() {
  const clock = useDayNight()
  return (
    <GameProvider>
      {createPortal(<BlogNav />, document.getElementById('chrome-top'))}
      {createPortal(<Footer clock={clock} />, document.getElementById('chrome-bottom'))}
      {deckSpot && createPortal(<DeckLaunch />, deckSpot)}
      <Toasts />
    </GameProvider>
  )
}

createRoot(document.getElementById('chrome')).render(
  <StrictMode>
    <Chrome />
  </StrictMode>,
)
