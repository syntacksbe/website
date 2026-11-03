import { useEffect, useRef, useState } from 'react'
import { useContent, useLang } from '../i18n.jsx'
import { useMedia } from '../useMedia.js'
import SectionHead from './SectionHead.jsx'
import { FINAL, LOOP, SCENES } from './CertScenes.jsx'
import { completeQuest } from '../gta/quests.js'
import { beep, shake } from '../arcade/fx.js'
import { useGtaState } from '../gta/store.js'
import { useGtaText } from '../gta/text.js'

// Certifications as a card deck. The cards are dealt in the order they were earned; the chosen one is shown
// big as a holographic card (it tilts with the mouse and flips to its abilities) with its own looping scene.
// The stat bars beside it are built from every card, with the chosen card's part lit up. Left alone, the
// deck moves to the next card after each loop, like the services loadout.
const TICK = 100
const TICKS = LOOP * (1000 / TICK)

// The stat keys, in bar order; their names are certs.stats (and certs.statsShort on the card) per language.
const STATS = ['platform', 'code', 'integration', 'service', 'data']

// The deck in one language: the certifications, then a locked last card for the visitor's own project.
function useDeck() {
  const { t } = useLang()
  const { certifications } = useContent()
  const next = { id: 'next', name: t('certs.nextName'), short: t('certs.nextName'), icon: '🔒', locked: true, stats: {}, perks: [], forYou: t('certs.nextText') }
  return { certifications, DECK: [...certifications, next] }
}

export default function Certifications() {
  const { t: tr } = useLang()
  const { certifications, DECK } = useDeck()
  const TOTAL = Object.fromEntries(STATS.map((k) => [k, certifications.reduce((n, c) => n + (c.stats[k] ?? 0), 0)]))
  const RARITY = tr('certs.rarity')
  const statName = tr('certs.stats')
  const statShort = tr('certs.statsShort')
  const [active, setActive] = useState(DECK.length - 2)
  const [tick, setTick] = useState(0)
  const [loop, setLoop] = useState(0) // remounts the scene so it starts clean
  const [idle, setIdle] = useState(true)
  const [hover, setHover] = useState(false)
  const [visible, setVisible] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const stacked = useMedia('(max-width: 1100px)') // stacked layout: no attract mode, it would swap the text you're reading
  const root = useRef(null)
  const rail = useRef(null)
  const tiltRef = useRef(null)
  const card = DECK[active]
  // The secret behind the locked card: five clicks pick the lock (a side quest).
  const gta = useGtaState()
  const G = useGtaText()
  const picked = gta.quests.includes('lockpick')
  const [tries, setTries] = useState(0)
  const pickLock = (e) => {
    if (picked) return
    const n = tries + 1
    setTries(n)
    shake(e.currentTarget)
    beep('tick')
    if (n >= 5) completeQuest('lockpick')
  }
  const Scene = SCENES[card.id]
  const t = reduced ? FINAL : tick / (1000 / TICK)
  const auto = idle && !hover && !flipped && !reduced && !stacked

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !visible) return
    const id = setInterval(() => setTick((n) => n + 1), TICK)
    return () => clearInterval(id)
  }, [reduced, visible])

  useEffect(() => {
    if (tick < TICKS) return
    if (auto) setActive((a) => (a + 1) % DECK.length)
    setLoop((l) => l + 1)
    setTick(0)
  }, [tick, auto, DECK.length])

  // On phones the rail is a swipeable row: keep the chosen card in view without moving the page.
  useEffect(() => {
    const r = rail.current
    const tile = r?.children[active]
    if (!tile || r.scrollWidth <= r.clientWidth) return
    r.scrollTo({ left: tile.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' })
  }, [active, reduced])

  const pick = (i) => {
    setActive(i)
    setTick(0)
    setLoop((l) => l + 1)
    setIdle(false)
    setFlipped(false)
  }

  const onKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (active + step + DECK.length) % DECK.length
    pick(next)
    rail.current.children[next].focus()
  }

  // The card leans towards the mouse and the foil follows it. Touch and reduced motion get a flat card.
  const tilt = (e) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const s = tiltRef.current.style
    s.setProperty('--mx', `${Math.round(x * 100)}%`)
    s.setProperty('--my', `${Math.round(y * 100)}%`)
    s.setProperty('--rx', `${((0.5 - y) * 14).toFixed(1)}deg`)
    s.setProperty('--ry', `${((x - 0.5) * 18).toFixed(1)}deg`)
  }
  const untilt = () => {
    const s = tiltRef.current.style
    for (const v of ['--mx', '--my', '--rx', '--ry']) s.removeProperty(v)
  }

  const gains = STATS.filter((k) => card.stats[k])

  return (
    <section className="section section-alt" id="certifications">
      <div className="container">
        <SectionHead kicker={tr('certs.kicker')} title={tr('certs.title', certifications.length)}>
          {tr('certs.sub')}
        </SectionHead>

        <div className="cd reveal" ref={root} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <div className="cd-rail" role="tablist" aria-label={tr('certs.tabs')} aria-orientation="vertical" ref={rail} onKeyDown={onKey}
            style={{ '--a': active, '--n': DECK.length }}>
            {DECK.map((c, i) => (
              <button
                type="button"
                role="tab"
                key={c.id}
                id={`cd-tab-${c.id}`}
                aria-selected={i === active}
                aria-controls="cd-panel"
                tabIndex={i === active ? 0 : -1}
                className={`cd-tile r-${c.rarity ?? 'locked'}`}
                style={{ '--i': i }}
                onClick={() => pick(i)}
              >
                <span className="cd-tile-icon" aria-hidden="true">{c.icon}</span>
                <strong>{c.short}</strong>
                <small>{c.locked ? tr('certs.locked') : `${c.year} · ${RARITY[c.rarity]}`}</small>
                {i === active && auto && <i className="ld-timer" style={{ width: `${(tick / TICKS) * 100}%` }} />}
              </button>
            ))}
          </div>

          <div className="cd-stage">
            <div className={`cd-holo r-${card.rarity ?? 'locked'}${card.locked && picked ? ' picked' : ''}`}
              onPointerMove={tilt} onPointerLeave={untilt}
              {...(card.locked && !picked ? { role: 'button', tabIndex: 0, 'aria-label': tr('certs.locked'), onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pickLock(e)) } : {})}
              onClick={(e) => (card.locked ? pickLock(e) : setFlipped((f) => !f))}>
              <div className="cd-tilt" ref={tiltRef}>
                <div className={`cd-card${flipped ? ' flipped' : ''}`} key={card.id}>
                  <div className="cd-face cd-front" aria-hidden={flipped}>
                    <p className="cd-top">
                      <span className="cd-rarity">{card.locked ? tr('certs.locked') : RARITY[card.rarity]}</span>
                      <span>{card.locked ? '#??' : `#${String(active + 1).padStart(2, '0')}/${certifications.length}`}</span>
                    </p>
                    <div className="cd-art" aria-hidden="true">
                      <div className="cd-scene" key={`${card.id}-${loop}`}><Scene t={t} /></div>
                    </div>
                    {card.locked && picked ? (
                      <>
                        <h3><span aria-hidden="true">🗝️</span> {G.quests.secretName}</h3>
                        <p className="cd-sub">{G.quests.secretKicker}</p>
                        <p className="cd-secret">{G.quests.secretText}</p>
                      </>
                    ) : (
                      <>
                        <h3><span aria-hidden="true">{card.icon}</span> {card.short}</h3>
                        <p className="cd-sub">{card.locked ? tr('certs.nextUnlock') : tr('certs.tier', card.tier, card.year)}</p>
                        <p className="cd-gains">
                          {card.locked
                            ? <span>{tr('certs.anyStat')}</span>
                            : gains.map((k) => <span key={k}>+{card.stats[k]} {statShort[k]}</span>)}
                        </p>
                      </>
                    )}

                    {!card.locked && <p className="cd-unlocked" key={loop}>{tr('certs.unlocked')}</p>}
                    <i className="cd-foil" />
                  </div>
                  {!card.locked && (
                    <div className="cd-face cd-back" aria-hidden={!flipped}>
                      <p className="cd-top"><span className="cd-rarity">{tr('certs.abilities')}</span><span>{card.year}</span></p>
                      <p className="cd-back-name">{card.name}</p>
                      <ul>{card.perks.map((p) => <li key={p}>{p}</li>)}</ul>
                      <p className="cd-back-note">{tr('certs.verifiedNote')}</p>
                      <i className="cd-foil" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!card.locked && (
              <button type="button" className="cd-flip" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
                ↻ {flipped ? tr('certs.showCard') : tr('certs.flip')}
              </button>
            )}
          </div>

          <div className="cd-info" role="tabpanel" id="cd-panel" aria-labelledby={`cd-tab-${card.id}`}>
            <div key={card.id} className="cd-info-text">
              <p className="ld-label">{card.locked ? tr('certs.lockedNext') : tr('certs.forYou')}</p>
              <h3>{card.name}</h3>
              <p>{card.forYou}</p>
              {card.locked && <a href="#contact" className="btn btn-primary btn-sm">{tr('certs.unlockCta')}</a>}
            </div>

            <div className="cd-stats" aria-label={tr('certs.statsAria')}>
              <p className="ld-label">{tr('certs.statsLabel')} {card.locked ? '' : <span>{tr('certs.lit')}</span>}</p>
              {STATS.map((k) => (
                <div className="cd-stat" key={k}>
                  <span className="cd-stat-name">{statName[k]}</span>
                  <div className="cd-bar" role="img" aria-label={tr('certs.barAria', statName[k], TOTAL[k], card.stats[k])}>
                    {certifications.map((c, i) => c.stats[k] ? (
                      <i key={c.id} className={c.id === card.id ? 'lit' : ''} style={{ width: `${c.stats[k]}%`, '--i': i }} />
                    ) : null)}
                  </div>
                  <b>{TOTAL[k]}</b>
                  <em key={`${card.id}-${k}`} className={card.stats[k] ? 'on' : ''}>{card.stats[k] ? `+${card.stats[k]}` : ''}</em>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="verify reveal">
          {tr('certs.verifyBefore')}{' '}
          <a href="https://trailhead.salesforce.com/credentials/verification" target="_blank" rel="noopener">
            Salesforce Trailhead
          </a>{tr('certs.verifyAfter')}
        </p>
      </div>
    </section>
  )
}
