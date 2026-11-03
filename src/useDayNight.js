import { useEffect, useState } from 'react'

const PHASES = ['day', 'sunset', 'night']
const THEME_COLOR = { day: '#f5f2ec', sunset: '#ffb27a', night: '#0d0e11' }

function brusselsTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

// Day, sunset (dusk and dawn) or night, from the current time in Brussels.
// `?time=day|sunset|night` in the URL forces a phase, handy for previewing.
export function phaseNow(date = new Date()) {
  const forced = new URLSearchParams(window.location.search).get('time')
  if (PHASES.includes(forced)) return forced
  const hour = Number(brusselsTime(date).slice(0, 2))
  if (hour >= 21 || hour < 6) return 'night'
  if (hour >= 18 || hour < 8) return 'sunset'
  return 'day'
}

// Keeps <html data-theme> in sync with the clock; returns the phase and the Brussels time.
export function useDayNight() {
  const [state, setState] = useState(() => ({ phase: phaseNow(), time: brusselsTime() }))

  useEffect(() => {
    const tick = () => setState({ phase: phaseNow(), time: brusselsTime() })
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = state.phase
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[state.phase])
  }, [state.phase])

  return state
}
