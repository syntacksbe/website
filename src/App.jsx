import { useEffect } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import TechStrip from './components/TechStrip.jsx'
import Services from './components/Services.jsx'
import HealthCheck from './components/HealthCheck.jsx'
import Certifications from './components/Certifications.jsx'
import Approach from './components/Approach.jsx'
import Experience from './components/Experience.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Toasts from './components/Toasts.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import MiniMap from './components/MiniMap.jsx'
import GtaLayer from './gta/GtaLayer.jsx'
import { GameProvider } from './game.jsx'
import { LangProvider } from './i18n.jsx'
import { useReveal } from './useReveal.js'
import { useDayNight } from './useDayNight.js'

export default function App() {
  useReveal()
  const clock = useDayNight()

  // A link from another page (the Arcade's menu goes to ../#services) arrives before React has drawn the
  // sections, so the browser can't jump there itself. Jump once they exist, and again when the fonts
  // have loaded and the layout has settled.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    const el = id && document.getElementById(id)
    if (!el) return
    const jump = () => el.scrollIntoView({ behavior: 'instant' })
    jump()
    document.fonts?.ready.then(jump)
  }, [])

  // LangProvider: English, Dutch or French (?lang=, the saved choice, then the browser language); see i18n.jsx.
  return (
    <LangProvider>
      <GameProvider>
        <LoadingScreen />
        <Nav />
        <main>
          <Hero />
          <TechStrip />
          <Services />
          <Certifications />
          <Approach />
          <Experience />
          <HealthCheck />
          <Contact />
        </main>
        <Footer clock={clock} />
        <MiniMap />
        <Toasts />
        <GtaLayer page="home" />
      </GameProvider>
    </LangProvider>
  )
}
