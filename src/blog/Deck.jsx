import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { beep, burst, floatText, haptic } from '../arcade/fx.js'

// Card deck mode for a patch-notes post: every tagged item of the post becomes a card you swipe.
// Right: "I'll use this". Left: "Skip". Up: "Breaks for me". At the end you get your own checklist for the
// release, which you can copy or save as a markdown file. The cards are read from the static article on the page
// (the .pn-item list items in each .pn-section), so a post needs nothing extra to get a deck.
// Picks are saved per post in localStorage, so a deck can be finished later.

const KEY = 'syntacks-patch-deck-v1'
const PICKS = {
  use: { label: "I'll use this", short: 'Use', icon: '★', key: '→', fx: '+ LOADOUT' },
  breaks: { label: 'Breaks for me', short: 'Breaks', icon: '⚠', key: '↑', fx: '⚠ FLAGGED' },
  skip: { label: 'Skip', short: 'Skip', icon: '✕', key: '←' },
}
// "What I'd actually use" repeats items from the other sections: start without it.
const DEFAULT_OFF = ['what-id-actually-use']

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}
function writeStore(slug, value) {
  try {
    const all = readStore()
    if (value) all[slug] = value
    else delete all[slug]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // No storage: the deck lasts for this visit.
  }
}

// The deck's raw material: each section with its tagged items, straight from the article.
function readPost() {
  const sections = [...document.querySelectorAll('.pn-section')].map((sec) => {
    const title = sec.querySelector('h2')?.textContent.trim() || sec.id
    const cards = [...sec.querySelectorAll(':scope > ul > li.pn-item')].map((li, i) => {
      const tag = [...li.classList].find((c) => c.startsWith('pn-item-'))?.slice(8) || 'new'
      const clone = li.cloneNode(true)
      clone.querySelector('.pn-tag')?.remove()
      const strong = clone.querySelector('strong')
      const lead = strong?.textContent.trim().replace(/[.:]$/, '')
      // The bold lead becomes the card's title, so the text after it loses its joining punctuation
      // ("**Heap limits**, with no code change" → "With no code change").
      const after = strong?.nextSibling
      if (after?.nodeType === Node.TEXT_NODE) {
        after.textContent = after.textContent.replace(/^[\s,.:;]+/, '').replace(/^\w/, (c) => c.toUpperCase())
      }
      const last = strong?.lastChild
      if (last?.nodeType === Node.TEXT_NODE) last.textContent = last.textContent.replace(/[\s.:]+$/, '')
      const text = clone.textContent.replace(/\s+/g, ' ').trim()
      return { id: `${sec.id}-${i}`, section: sec.id, sectionTitle: title, tag, html: clone.innerHTML, lead, text }
    })
    return { id: sec.id, title, cards }
  })
  return {
    title: document.querySelector('.pn-head h1')?.textContent.trim() || 'Release',
    slug: location.pathname.replace(/\/$/, '').split('/').pop(),
    sections: sections.filter((s) => s.cards.length),
  }
}

const TAG_LABEL = { new: 'New', buff: 'Buff', nerf: 'Nerf', fix: 'Fix', breaking: 'Breaking', beta: 'Beta', pilot: 'Pilot', retired: 'Retired' }

// One line per card for the checklist: the bold lead when there is one, else the first words.
const lineFor = (c) => c.lead || (c.text.length > 110 ? `${c.text.slice(0, 107)}…` : c.text)

function checklist(post, cards, picks) {
  const url = `${location.origin}${location.pathname}`
  const group = (kind) => cards.filter((c) => picks[c.id] === kind)
  const out = [`Salesforce ${post.title}: my checklist`, url, '']
  const breaks = group('breaks')
  const use = group('use')
  if (breaks.length) out.push('BREAKS FOR ME (do these first)', ...breaks.map((c) => `- [ ] ${lineFor(c)} (${c.sectionTitle})`), '')
  if (use.length) out.push("I'LL USE THIS", ...use.map((c) => `- [ ] ${lineFor(c)} (${c.sectionTitle})`), '')
  out.push('From the Syntacks patch notes.')
  return out.join('\n')
}

export default function DeckLaunch() {
  const post = useMemo(readPost, [])
  const total = post.sections.reduce((n, s) => n + s.cards.length, 0)
  const [open, setOpen] = useState(false)
  const saved = readStore()[post.slug]
  const swiped = saved ? Object.keys(saved.picks || {}).length : 0
  if (!total) return null
  return (
    <>
      <button type="button" className="pn-deck-launch" onClick={() => setOpen(true)}>
        <span className="pn-deck-launch-cards" aria-hidden="true"><i /><i /><i /></span>
        <span className="pn-deck-launch-text">
          <b>{swiped ? 'Continue the card deck' : 'Play it as a card deck'}</b>
          <small>{swiped ? `${swiped} of your cards swiped` : `${total} cards · swipe what matters, get your own checklist`}</small>
        </span>
        <span className="pn-deck-launch-go" aria-hidden="true">▶</span>
      </button>
      {open && createPortal(<Deck post={post} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function Deck({ post, onClose }) {
  const saved = readStore()[post.slug]
  const [chosen, setChosen] = useState(() => saved?.sections || post.sections.map((s) => s.id).filter((id) => !DEFAULT_OFF.includes(id)))
  const [picks, setPicks] = useState(() => saved?.picks || {})
  const [history, setHistory] = useState([]) // card ids, last swiped last, for undo
  const [screen, setScreen] = useState(saved && Object.keys(saved.picks || {}).length ? 'resume' : 'start')
  const dialog = useRef(null)

  const cards = useMemo(() => post.sections.filter((s) => chosen.includes(s.id)).flatMap((s) => s.cards), [post, chosen])
  const left = cards.filter((c) => !picks[c.id])

  // Save every change; an empty deck is forgotten.
  useEffect(() => {
    writeStore(post.slug, Object.keys(picks).length ? { sections: chosen, picks } : null)
  }, [post.slug, chosen, picks])

  // A modal: no page scroll behind it, Escape closes, focus starts inside.
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const pick = useCallback((card, kind) => {
    setPicks((p) => ({ ...p, [card.id]: kind }))
    setHistory((h) => [...h, card.id])
  }, [])
  const undo = useCallback(() => {
    setHistory((h) => {
      const id = h[h.length - 1]
      if (!id) return h
      setPicks((p) => {
        const next = { ...p }
        delete next[id]
        return next
      })
      return h.slice(0, -1)
    })
  }, [])

  const restart = () => {
    setPicks({})
    setHistory([])
    setScreen('start')
  }

  useEffect(() => {
    if (screen === 'play' && cards.length && !left.length) {
      setScreen('done')
      beep('win')
      burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 28 })
    }
  }, [screen, cards.length, left.length])

  return (
    <div className="pn-deck" role="dialog" aria-modal="true" aria-label={`${post.title} card deck`} ref={dialog} tabIndex={-1}>
      <div className="pn-deck-box">
        <header className="pn-deck-top">
          <p><b>{post.title}</b> · card deck</p>
          <button type="button" className="pn-deck-x" onClick={onClose} aria-label="Close the deck">✕</button>
        </header>
        {screen === 'resume' && (
          <Resume
            post={post} picks={picks} cards={cards} left={left.length}
            onGo={() => setScreen(left.length ? 'play' : 'done')} onRestart={restart}
          />
        )}
        {screen === 'start' && (
          <Start post={post} chosen={chosen} setChosen={setChosen} count={cards.length} onDeal={() => setScreen('play')} />
        )}
        {screen === 'play' && <Play cards={cards} picks={picks} left={left} onPick={pick} onUndo={undo} canUndo={history.length > 0} />}
        {screen === 'done' && <Done post={post} cards={cards} picks={picks} onRestart={restart} onClose={onClose} />}
      </div>
    </div>
  )
}

function Resume({ post, picks, cards, left, onGo, onRestart }) {
  const n = (kind) => cards.filter((c) => picks[c.id] === kind).length
  return (
    <div className="pn-deck-start">
      <h2>Welcome back</h2>
      <p>You were halfway through {post.title}: {n('use')} to use, {n('breaks')} that break something, {n('skip')} skipped.</p>
      <div className="pn-deck-actions">
        <button type="button" className="btn btn-primary" onClick={onGo}>{left ? `Continue · ${left} cards left` : 'See my checklist'}</button>
        <button type="button" className="btn btn-ghost" onClick={onRestart}>Start over</button>
      </div>
    </div>
  )
}

function Start({ post, chosen, setChosen, count, onDeal }) {
  const flip = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  return (
    <div className="pn-deck-start">
      <h2>Deal the cards</h2>
      <p>One card per change. Swipe it, or use the buttons or the arrow keys.</p>
      <ul className="pn-deck-rules">
        <li><kbd>→</kbd><b>{PICKS.use.label}</b> goes on your checklist.</li>
        <li><kbd>↑</kbd><b>{PICKS.breaks.label}</b> goes on top of it, to do first.</li>
        <li><kbd>←</kbd><b>{PICKS.skip.label}</b>: not for you.</li>
      </ul>
      <p className="pn-deck-label">Which sections?</p>
      <div className="pn-deck-chips">
        {post.sections.map((s) => (
          <button key={s.id} type="button" role="checkbox" aria-checked={chosen.includes(s.id)} onClick={() => flip(s.id)}>
            {s.title} <small>{s.cards.length}</small>
          </button>
        ))}
      </div>
      <div className="pn-deck-actions">
        <button type="button" className="btn btn-primary" disabled={!count} onClick={onDeal}>Deal {count} cards</button>
      </div>
    </div>
  )
}

const FLY = { use: 'translate(140%, 8%) rotate(28deg)', skip: 'translate(-140%, 8%) rotate(-28deg)', breaks: 'translate(0, -130%) rotate(-4deg)' }

function Play({ cards, picks, left, onPick, onUndo, canUndo }) {
  const [drag, setDrag] = useState(null)
  const [fly, setFly] = useState(null)
  const start = useRef(null)
  const card = left[0]
  const done = cards.length - left.length
  const count = (kind) => cards.filter((c) => picks[c.id] === kind).length

  const choose = useCallback((kind) => {
    if (!card || fly) return
    setFly(kind)
    if (kind === 'skip') beep('tick')
    else {
      beep('good')
      haptic(12)
      floatText(PICKS[kind].fx, { tone: kind === 'breaks' ? 'bad' : 'good' })
    }
    setTimeout(() => {
      onPick(card, kind)
      setFly(null)
      setDrag(null)
    }, 240)
  }, [card, fly, onPick])

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const k = e.key
      if (k === 'ArrowRight') choose('use')
      else if (k === 'ArrowLeft') choose('skip')
      else if (k === 'ArrowUp') choose('breaks')
      else if (k === 'Backspace' && canUndo) onUndo()
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('keydown', onKey, true) // first, so the page's tab keys stay out of it
    return () => document.removeEventListener('keydown', onKey, true)
  }, [choose, onUndo, canUndo])

  const down = (e) => {
    if (e.target.closest('a')) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => start.current && setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  const up = () => {
    if (!start.current) return
    const d = drag ?? { dx: 0, dy: 0 }
    start.current = null
    if (d.dy < -80 && Math.abs(d.dy) > Math.abs(d.dx)) choose('breaks')
    else if (d.dx > 90) choose('use')
    else if (d.dx < -90) choose('skip')
    else setDrag(null)
  }
  const lean = drag ? (drag.dy < -40 && Math.abs(drag.dy) > Math.abs(drag.dx) ? 'breaks' : drag.dx > 40 ? 'use' : drag.dx < -40 ? 'skip' : null) : null

  return (
    <div className="pn-deck-play">
      <div className="pn-deck-hud">
        <span className="pn-deck-progress"><i style={{ width: `${(done / cards.length) * 100}%` }} /></span>
        <span className="pn-deck-n">{Math.min(done + 1, cards.length)} / {cards.length}</span>
        <span className="pn-deck-tally use">★ {count('use')}</span>
        <span className="pn-deck-tally breaks">⚠ {count('breaks')}</span>
      </div>
      <div className="pn-deck-stage">
        <span className={`pn-deck-zone skip${lean === 'skip' ? ' lit' : ''}`}>✕ Skip</span>
        <span className={`pn-deck-zone use${lean === 'use' ? ' lit' : ''}`}>★ Use</span>
        <span className={`pn-deck-zone breaks${lean === 'breaks' ? ' lit' : ''}`}>⚠ Breaks for me</span>
        {left.slice(1, 3).reverse().map((c, k, arr) => (
          <div key={c.id} className="pn-deck-card back" style={{ '--k': arr.length - k }} aria-hidden="true" />
        ))}
        {card && (
          <article
            key={card.id}
            className={`pn-deck-card top tag-${card.tag}${fly ? ' fly' : ''}${lean ? ` lean-${lean}` : ''}`}
            style={{ transform: fly ? FLY[fly] : drag ? `translate(${drag.dx}px, ${Math.min(0, drag.dy) * 0.7}px) rotate(${drag.dx / 16}deg)` : undefined }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; setDrag(null) }}
            aria-live="polite"
          >
            <header>
              <span className={`pn-tag pn-${card.tag}`}>{TAG_LABEL[card.tag] || card.tag}</span>
              <small>{card.sectionTitle}</small>
            </header>
            <div className="pn-deck-card-body" dangerouslySetInnerHTML={{ __html: card.html }} />
          </article>
        )}
      </div>
      <div className="pn-deck-buttons">
        <button type="button" className="skip" onClick={() => choose('skip')}><kbd>←</kbd> Skip</button>
        <button type="button" className="breaks" onClick={() => choose('breaks')}><kbd>↑</kbd> Breaks for me</button>
        <button type="button" className="use" onClick={() => choose('use')}><kbd>→</kbd> I'll use this</button>
      </div>
      <button type="button" className="pn-deck-undo" onClick={onUndo} disabled={!canUndo}>↶ Undo <kbd>⌫</kbd></button>
    </div>
  )
}

function Done({ post, cards, picks, onRestart, onClose }) {
  const [said, setSaid] = useState('')
  const group = (kind) => cards.filter((c) => picks[c.id] === kind)
  const breaks = group('breaks')
  const use = group('use')
  const text = checklist(post, cards, picks)

  const copy = async () => {
    const ok = () => setSaid('Copied. Paste it in your notes or a ticket.')
    try {
      await navigator.clipboard.writeText(text)
      return ok()
    } catch {
      // Some browsers and embedded views block the clipboard API: fall back to a selected textarea.
    }
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(area)
    area.select()
    const done = document.execCommand?.('copy')
    area.remove()
    if (done) ok()
    else setSaid('Copy is blocked here: use "Save as file".')
  }
  const save = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
    a.download = `salesforce-${post.slug}-checklist.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const goTo = (c) => {
    onClose()
    location.hash = c.section
  }
  const List = ({ items, kind }) => (
    <ul className={`pn-deck-list ${kind}`}>
      {items.map((c) => (
        <li key={c.id}>
          <span className={`pn-tag pn-${c.tag}`}>{TAG_LABEL[c.tag]}</span>
          <span>{lineFor(c)}</span>
          <button type="button" onClick={() => goTo(c)} title={`Read it in ${c.sectionTitle}`}>{c.sectionTitle} ↗</button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="pn-deck-done">
      <p className="pn-deck-label">Mission passed</p>
      <h2>Your {post.title} loadout</h2>
      <p className="pn-deck-score">
        <span className="breaks">⚠ {breaks.length} to fix first</span>
        <span className="use">★ {use.length} to use</span>
        <span>✕ {cards.length - breaks.length - use.length} skipped</span>
      </p>
      {breaks.length > 0 && <><h3>Breaks for me · do these first</h3><List items={breaks} kind="breaks" /></>}
      {use.length > 0 && <><h3>I'll use this</h3><List items={use} kind="use" /></>}
      {!breaks.length && !use.length && <p>Nothing kept. A quiet patch for you, or a very strict mood.</p>}
      <div className="pn-deck-actions">
        {(breaks.length > 0 || use.length > 0) && (
          <>
            <button type="button" className="btn btn-primary" onClick={copy}>Copy checklist</button>
            <button type="button" className="btn btn-ghost" onClick={save}>Save as file</button>
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={onRestart}>Deal again</button>
      </div>
      <p className="pn-deck-said" aria-live="polite">{said}</p>
    </div>
  )
}
