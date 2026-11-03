import { useEffect, useMemo, useState } from 'react'
import { wordFor } from './daily-words.js'
import { beep, burst, haptic } from './fx.js'
import { ShareCardButton } from './share.jsx'

// Daily Sforcle: guess today's Salesforce word in six tries. Everyone gets the same word on the
// same Brussels day; results and the streak are saved in localStorage.
const KEY = 'syntacks-sforcle'
const TRIES = 6
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫']

function brusselsDay(date = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(date) // 2026-11-03
  return { key: ymd, number: Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86400000) - 20453 } // #1 = 2026-01-01
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

// Wordle colours: right place, wrong place, absent. Letters used up by exact hits don't count twice.
function grade(guess, word) {
  const res = Array(word.length).fill('absent')
  const left = {}
  for (let i = 0; i < word.length; i++) {
    if (guess[i] === word[i]) res[i] = 'hit'
    else left[word[i]] = (left[word[i]] ?? 0) + 1
  }
  for (let i = 0; i < word.length; i++) {
    if (res[i] !== 'hit' && left[guess[i]] > 0) {
      res[i] = 'near'
      left[guess[i]]--
    }
  }
  return res
}

export default function Daily() {
  const day = useMemo(() => brusselsDay(), [])
  const { word, clue, fact } = useMemo(() => wordFor(day.number), [day])
  const [save, setSave] = useState(load)
  const today = save.days?.[day.key] ?? { guesses: [] }
  const [current, setCurrent] = useState('')
  const [showClue, setShowClue] = useState(false)
  const [msg, setMsg] = useState('')
  const [shakeRow, setShakeRow] = useState(false)
  const won = today.guesses.includes(word)
  const lost = !won && today.guesses.length >= TRIES
  const over = won || lost

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save))
    } catch {
      // Without storage the game lasts for this visit only.
    }
  }, [save])

  const status = useMemo(() => {
    const best = {}
    const rank = { hit: 3, near: 2, absent: 1 }
    for (const g of today.guesses) grade(g, word).forEach((s, i) => { if (!best[g[i]] || rank[s] > rank[best[g[i]]]) best[g[i]] = s })
    return best
  }, [today.guesses, word])

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 1800)
  }

  function submit() {
    if (over) return
    if (current.length !== word.length) {
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 450)
      haptic(60)
      return flash(`The word has ${word.length} letters`)
    }
    const guesses = [...today.guesses, current]
    const solved = current === word
    const done = solved || guesses.length >= TRIES
    const yesterday = brusselsDay(new Date(Date.now() - 86400000)).key
    const streak = solved ? (save.lastWin === yesterday ? (save.streak ?? 0) + 1 : 1) : done ? 0 : save.streak ?? 0
    setSave({
      ...save,
      days: { ...save.days, [day.key]: { guesses } },
      ...(done ? { streak, lastWin: solved ? day.key : save.lastWin, played: (save.played ?? 0) + 1, wins: (save.wins ?? 0) + (solved ? 1 : 0) } : {}),
    })
    setCurrent('')
    if (solved) {
      setTimeout(() => {
        beep('win')
        burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 40 })
        haptic([20, 40, 20, 40, 60])
      }, word.length * 180 + 200)
    } else if (done) setTimeout(() => beep('lose'), word.length * 180)
    else beep('tick')
  }

  function key(k) {
    if (over) return
    if (k === '⏎') return submit()
    if (k === '⌫') return setCurrent((c) => c.slice(0, -1))
    if (/^[A-Z]$/.test(k) && current.length < word.length) setCurrent((c) => c + k)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') key('⏎')
      else if (e.key === 'Backspace') key('⌫')
      else if (/^[a-z]$/i.test(e.key)) key(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function share() {
    const grid = today.guesses.map((g) => grade(g, word).map((s) => ({ hit: '🟩', near: '🟨', absent: '⬛' })[s]).join('')).join('\n')
    const text = `Syntacks Sforcle #${day.number} ${won ? today.guesses.length : 'X'}/${TRIES}\n${grid}\n${window.location.href.split('#')[0]}#/daily`
    navigator.clipboard?.writeText(text).then(() => flash('Result copied — paste it anywhere'), () => flash('Couldn’t copy'))
  }

  const rows = Array.from({ length: TRIES }, (_, r) => today.guesses[r] ?? (r === today.guesses.length ? current : ''))

  return (
    <div className="container ar-daily">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-daily-head">
        <p className="kicker">Daily · #{day.number}</p>
        <h1>Sforcle</h1>
        <p>Guess today’s Salesforce word in {TRIES} tries. 🟩 right spot · 🟨 in the word · ⬛ not in it.</p>
        <p className="ar-daily-stats">
          <span>🔥 Streak <b>{save.streak ?? 0}</b></span>
          <span>Played <b>{save.played ?? 0}</b></span>
          <span>Won <b>{save.played ? Math.round(((save.wins ?? 0) / save.played) * 100) : 0}%</b></span>
        </p>
      </header>

      <div className="ar-daily-board" style={{ '--n': word.length }} aria-label="Guesses">
        {rows.map((g, r) => {
          const graded = r < today.guesses.length ? grade(g, word) : null
          return (
            <div key={r} className={`ar-daily-row${r === today.guesses.length && shakeRow ? ' fx-shake' : ''}`}>
              {Array.from({ length: word.length }, (_, i) => (
                <span key={i} className={`ar-tile-l${g[i] ? ' filled' : ''}${graded ? ` ${graded[i]} flip` : ''}`} style={{ '--d': `${i * 180}ms` }}>
                  {g[i] ?? ''}
                </span>
              ))}
            </div>
          )
        })}
      </div>

      <p className="ar-daily-msg" role="status">{msg}</p>

      {!over && (
        <p className="ar-daily-cluebar">
          {showClue ? <span>💡 {clue}</span> : <button type="button" onClick={() => setShowClue(true)}>💡 Show a clue</button>}
          <span>{word.length} letters</span>
        </p>
      )}

      {over && (
        <div className={`ar-daily-end ${won ? 'won' : 'lost'}`}>
          <span className={`hc-stamp ${won ? 'good' : 'bad'}`}>{won ? 'Mission passed' : 'Wasted'}</span>
          <p className="ar-daily-word">The word was <b>{word}</b></p>
          <p>{fact}</p>
          <div className="sim-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={share}>📋 Share result</button>
            <ShareCardButton
              card={{
                kicker: `Daily Sforcle · #${day.number}`,
                title: `Sforcle #${day.number}`,
                grid: today.guesses.map((g) => grade(g, word)),
                big: `${won ? today.guesses.length : 'X'}/${TRIES}`,
                unit: won ? `guess${today.guesses.length === 1 ? '' : 'es'}` : 'not today',
                stamp: won ? { label: 'Mission passed', tone: 'good' } : { label: 'Wasted', tone: 'bad' },
              }}
              text={`Syntacks Sforcle #${day.number}: ${won ? today.guesses.length : 'X'}/${TRIES}.`}
              link={`${window.location.href.split('#')[0]}#/daily`}
            />
            <a className="btn btn-ghost btn-sm" href="#/">Play more games</a>
          </div>
          <p className="ar-help">A new word every day at midnight, Brussels time.</p>
        </div>
      )}

      <div className="ar-kbd" aria-label="Keyboard">
        {ROWS.map((row) => (
          <div key={row}>
            {[...row].map((k) => (
              <button
                type="button" key={k} onClick={() => key(k)} disabled={over}
                className={`${status[k] ?? ''}${k === '⏎' || k === '⌫' ? ' wide' : ''}`}
                aria-label={k === '⏎' ? 'Enter' : k === '⌫' ? 'Delete' : k}
              >
                {k === '⏎' ? 'Enter' : k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
