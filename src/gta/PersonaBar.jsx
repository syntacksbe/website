import { personaById } from './personas.js'
import { signal, useGtaState } from './store.js'
import { useGtaText } from './text.js'

// "Playing as" above the services loadout: the chosen character, its stats and the buttons for both wheels.
export default function PersonaBar() {
  const T = useGtaText().personas
  const W = useGtaText().wheel
  const p = personaById(useGtaState().persona)
  return (
    <div className="gta-persona">
      <span className="gta-persona-face" aria-hidden="true" key={p.id}>{p.icon}</span>
      <div className="gta-persona-who">
        <small>{T.playing}</small>
        <strong>{T[p.id][0]}</strong>
        <span>{T[p.id][1]} {T.lit}</span>
      </div>
      <dl className="gta-persona-stats">
        {Object.entries(p.stats).map(([k, v]) => (
          <div key={k}>
            <dt>{T.stats[k]}</dt>
            <dd><i style={{ '--v': v / 100 }} /><span className="sr-only">{v}%</span></dd>
          </div>
        ))}
      </dl>
      <div className="gta-persona-btns">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => signal('wheel', 'character')}>⟳ {T.switch} <kbd>C</kbd></button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => signal('wheel', 'tools')}>🔧 {T.tools} <kbd>Q</kbd></button>
      </div>
      <span className="sr-only">{W.holdC}</span>
    </div>
  )
}
