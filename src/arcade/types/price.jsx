import { useEffect, useMemo, useRef, useState } from 'react'
import './price.css'
import { STAGES, money, priceLine, scoreGuess, tierLabel } from './price.check.js'

// "Price is right": read the quote line and its pricing steps, guess the net, then watch the price
// waterfall step down from list to net with your guess marked on it.

const STEP_MS = 560 // a new waterfall row starts every STEP_MS
const ROW_MS = 460 // and takes ROW_MS to slide and count

const ease = (p) => 1 - (1 - p) ** 3
const clamp = (p) => Math.min(1, Math.max(0, p))

// A slider step that suits the size of the range: 1, 2, 5, 10, 20, 50 …
function niceStep(max) {
  const raw = max / 400
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}

// Milliseconds since `running` turned true, ticking until `total` (instant with reduced motion).
function useClock(running, total) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!running) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(Infinity)
      return undefined
    }
    let raf
    const start = performance.now()
    const tick = (now) => {
      setT(now - start)
      if (now - start < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, total])
  return t
}

const VERDICTS = {
  1: { icon: '🎯', label: 'Bullseye', tone: 'hot' },
  0.75: { icon: '🔥', label: 'Close', tone: 'warm' },
  0.5: { icon: '🔥', label: 'Close-ish', tone: 'warm' },
  0: { icon: '❄️', label: 'Cold', tone: 'cold' },
}

function StepText({ step }) {
  if (step.kind !== 'schedule') return step.label
  return (
    <>
      {step.label}
      <span className="ar-price-tiers">
        {step.tiers.map((t, i) => <span key={t.from}>{tierLabel(step.tiers, i)} units → {t.pct}%</span>)}
      </span>
    </>
  )
}

export default function PriceRound({ round, done, onResult }) {
  const calc = useMemo(() => priceLine(round), [round])
  const unitWord = round.target === 'net-unit' ? 'net unit price' : 'net total'
  const max = useMemo(() => {
    const top = Math.max(calc.list, ...calc.stages.map((s) => s.after)) * 1.25
    const step = niceStep(top)
    return Math.ceil(top / step) * step
  }, [calc])
  const step = niceStep(max)

  const [text, setText] = useState(String(calc.list))
  const [guess, setGuess] = useState(null) // locked guess
  const sent = useRef(false)
  const value = Number.parseFloat(text)
  const valid = Number.isFinite(value) && value > 0
  const frozen = done || guess != null

  const lock = () => {
    if (frozen || !valid || sent.current) return
    sent.current = true
    setGuess(value)
    onResult(scoreGuess(value, calc.net))
  }

  return (
    <>
      <p className="ar-q">{round.q}</p>

      <div className="ar-price-quote">
        <span className="ar-price-tag" aria-hidden="true">Quote line</span>
        <strong className="ar-price-product">{round.product}</strong>
        <dl className="ar-price-facts">
          <div><dt>Quantity</dt><dd>{round.qty}</dd></div>
          <div><dt>List unit price</dt><dd>{money(round.listPrice)}</dd></div>
          <div><dt>Guess the</dt><dd className="ar-price-target">{unitWord}</dd></div>
        </dl>
      </div>

      {!frozen && (
        <>
          <ol className="ar-price-steps" aria-label="Pricing steps, in order">
            {round.steps.map((s, i) => (
              <li key={i}>
                <b aria-hidden="true">{i + 1}</b>
                <span><StepText step={s} /></span>
                {s.stage && <em>{STAGES[s.stage]}</em>}
              </li>
            ))}
          </ol>

          <div className="ar-price-guess">
            <label htmlFor="ar-price-input" className="ar-price-label">Your {unitWord}</label>
            <output className="ar-price-big" htmlFor="ar-price-input" aria-live="off">{valid ? money(value, true) : '€—'}</output>
            <input
              type="range" className="ar-price-slider" min={0} max={max} step={step}
              value={valid ? Math.min(value, max) : 0} onChange={(e) => setText(e.target.value)}
              aria-label={`Your ${unitWord}, slider`} style={{ '--fill': `${(clamp((valid ? value : 0) / max) * 100).toFixed(2)}%` }}
            />
            <div className="ar-price-entry">
              <span aria-hidden="true">€</span>
              <input
                id="ar-price-input" type="number" inputMode="decimal" min={0} step={0.01} value={text}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lock()}
              />
              <button type="button" className="ar-price-lock" onClick={lock} disabled={!valid}>Lock it in</button>
            </div>
          </div>
        </>
      )}

      {frozen && <Waterfall round={round} calc={calc} guess={guess} unitWord={unitWord} />}
    </>
  )
}

function Waterfall({ round, calc, guess, unitWord }) {
  const rows = [
    { label: round.target === 'net-unit' ? 'List unit price' : `List total (${round.qty} × ${money(round.listPrice)})`, from: 0, to: calc.list, kind: 'base' },
    ...calc.stages.map((s) => ({
      label: s.step.label,
      stage: s.step.stage && STAGES[s.step.stage],
      detail: s.detail,
      unit: round.target === 'net-total' && s.after !== s.unit ? s.unit : null,
      from: s.before,
      to: s.after,
      kind: s.after > s.before ? 'up' : 'down',
    })),
    { label: unitWord === 'net total' ? 'Net total' : 'Net unit price', from: 0, to: calc.net, kind: 'net' },
  ]
  const end = (rows.length - 1) * STEP_MS + ROW_MS
  const t = useClock(true, end + 400)
  const revealed = t >= end
  const scale = Math.max(...rows.map((r) => r.to), calc.list, guess ?? 0) * 1.04
  const pos = (v) => `${(clamp(v / scale) * 100).toFixed(2)}%`
  const score = guess == null ? null : scoreGuess(guess, calc.net)
  const verdict = VERDICTS[score]
  const off = guess == null ? 0 : ((guess - calc.net) / calc.net) * 100

  return (
    <div className="ar-price-reveal">
      <ol className="ar-price-fall" aria-label={`Price waterfall from ${money(calc.list)} to ${money(calc.net)}`}>
        {rows.map((r, i) => {
          const p = ease(clamp((t - i * STEP_MS) / ROW_MS))
          const shown = r.from + (r.to - r.from) * p
          const lo = r.kind === 'down' ? shown : r.from
          const hi = r.kind === 'down' ? r.from : shown
          return (
            <li key={i} className={`ar-price-row ${r.kind}`} style={{ opacity: t >= i * STEP_MS ? 1 : 0.12 }}>
              <div className="ar-price-row-head">
                <span className="ar-price-row-label">
                  {r.label}
                  {r.stage && <em>→ {r.stage}</em>}
                </span>
                <span className="ar-price-row-value">{money(r.kind === 'base' || r.kind === 'net' ? r.to * p : shown, true)}</span>
              </div>
              <div className="ar-price-track">
                {r.kind !== 'base' && r.kind !== 'net' && <i className="ar-price-ghost" style={{ width: pos(lo) }} />}
                <i className="ar-price-bar" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }} />
                {guess != null && <i className={`ar-price-mark${revealed ? ' on' : ''}`} style={{ left: pos(guess) }} />}
              </div>
              {(r.detail || r.unit != null) && (
                <small className="ar-price-row-note">{[r.detail, r.unit != null && `${money(r.unit, true)} per unit`].filter(Boolean).join(' · ')}</small>
              )}
            </li>
          )
        })}
      </ol>

      {revealed && (
        <div className={`ar-price-verdict ${verdict?.tone ?? ''}`}>
          {verdict && <span className="ar-price-badge"><span aria-hidden="true">{verdict.icon}</span> {verdict.label}</span>}
          <div className="ar-price-duel">
            {guess != null && (
              <div>
                <small>Your guess</small>
                <strong>{money(guess, true)}</strong>
              </div>
            )}
            <div className="real">
              <small>Real {unitWord}</small>
              <strong>{money(calc.net, true)}</strong>
            </div>
          </div>
          {guess != null && (
            <p>{Math.abs(off) < 0.005 ? 'Spot on, to the cent.' : `${Math.abs(off).toFixed(1)}% ${off > 0 ? 'too high' : 'too low'}`}</p>
          )}
        </div>
      )}
    </div>
  )
}
