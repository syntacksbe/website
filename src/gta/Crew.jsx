import { useState } from 'react'
import { beep } from '../arcade/fx.js'
import { readGta, useGtaState, writeGta } from './store.js'
import { useGtaText } from './text.js'

// The heist crew screen under the plan: pick who covers each role and see how it changes the odds.
// It shows how I staff a job: I design and build, and can take the admin work too; your side brings a project lead
// and key users.
// `skill` drives the odds, `load` the cut (each role's share of the work). Names and notes are GTA_TEXT.crew.slots.
const SLOTS = [
  { id: 'dev', icon: '⌨️', options: [{ id: 'marc', skill: 90, load: 4 }] },
  { id: 'admin', icon: '🛠️', options: [{ id: 'yours', skill: 80, load: 2 }, { id: 'marc', skill: 85, load: 1 }, { id: 'none', skill: 0, load: 0 }] },
  { id: 'lead', icon: '🧭', options: [{ id: 'po', skill: 85, load: 2 }, { id: 'marc', skill: 65, load: 1 }, { id: 'none', skill: 0, load: 0 }] },
  { id: 'users', icon: '🧪', options: [{ id: 'yours', skill: 80, load: 2 }, { id: 'none', skill: 0, load: 0 }] },
]

export default function Crew() {
  const T = useGtaText().crew
  const saved = useGtaState().crew
  const [picks, setPicks] = useState(() => ({ dev: 'marc', admin: null, lead: null, users: null, ...(saved || {}) }))
  const chosen = SLOTS.map((s) => ({ slot: s, option: s.options.find((o) => o.id === picks[s.id]) ?? null }))
  const load = chosen.reduce((n, c) => n + (c.option?.load ?? 0), 0) || 1
  const odds = Math.round(chosen.reduce((n, c) => n + (c.option?.skill ?? 0), 0) / SLOTS.length)
  const full = chosen.every((c) => c.option)
  const gap = chosen.find((c) => c.option?.id === 'none' || !c.option)
  const verdict = full && !gap ? T.verdict.good : gap && full ? T.verdict[gap.slot.id] : null

  const pick = (slot, option) => {
    const next = { ...picks, [slot]: option }
    setPicks(next)
    beep('tick')
    if (SLOTS.every((s) => next[s.id])) {
      const { dev, ...crew } = next
      void dev
      if (!readGta().crew) beep('win')
      writeGta({ crew })
    }
  }

  return (
    <div className="gta-crew reveal">
      <header className="gta-crew-head">
        <div>
          <p className="gta-label">{T.kicker}</p>
          <h3>{T.title}</h3>
          <p>{T.sub}</p>
        </div>
        <div className="gta-odds" role="status">
          <small>{T.odds}</small>
          <strong className={odds >= 80 ? 'good' : odds >= 60 ? 'warn' : 'bad'}>{odds}%</strong>
        </div>
      </header>
      <div className="gta-crew-slots">
        {chosen.map(({ slot, option }) => {
          const [role, options] = T.slots[slot.id]
          return (
            <fieldset key={slot.id} className={`gta-slot${option?.id === 'none' ? ' empty' : ''}`}>
              <legend><span aria-hidden="true">{slot.icon}</span> {role}</legend>
              <div className="gta-slot-options">
                {slot.options.map((o) => (
                  <label key={o.id} className={`gta-opt${picks[slot.id] === o.id ? ' on' : ''}`}>
                    <input type="radio" name={`crew-${slot.id}`} checked={picks[slot.id] === o.id} onChange={() => pick(slot.id, o.id)} disabled={slot.options.length === 1} />
                    <strong>{options[o.id][0]}</strong>
                    <small>{options[o.id][1]}</small>
                  </label>
                ))}
              </div>
              <dl className="gta-slot-stats">
                <div><dt>{T.skill}</dt><dd><span className="gta-bar"><i style={{ '--v': (option?.skill ?? 0) / 100 }} /></span><b>{option?.skill ?? 0}%</b></dd></div>
                <div><dt>{T.cut}</dt><dd><b>{option ? Math.round((option.load / load) * 100) : 0}%</b></dd></div>
              </dl>
              {slot.options.length === 1 && <p className="gta-slot-lock">🔒 {T.locked}</p>}
            </fieldset>
          )
        })}
      </div>
      <footer className="gta-crew-foot">
        <p>{verdict ?? T.cutNote}</p>
        {full && <span className="gta-crew-ok">✓ {T.assembled}</span>}
        <a href="#contact" className="btn btn-primary btn-sm">{T.cta}</a>
      </footer>
    </div>
  )
}
