import { useEffect, useMemo, useRef, useState } from 'react'
import './conveyor.css'

// Deploy conveyor: load metadata crates onto the belt in the order they should ship, then deploy.
// A crate whose dependencies haven't landed in Production yet explodes. Score = share that landed.

const KINDS = {
  CustomObject: ['🗄️', 'Object'],
  CustomField: ['🏷️', 'Field'],
  ApexClass: ['⚙️', 'Apex class'],
  ApexTrigger: ['⚡', 'Trigger'],
  Flow: ['🌊', 'Flow'],
  PermissionSet: ['🔑', 'Permission set'],
  NamedCredential: ['🔗', 'Named credential'],
  ExternalCredential: ['🔐', 'External credential'],
  AuthProvider: ['🪪', 'Auth provider'],
  ExternalServiceRegistration: ['🛰️', 'External service'],
  Layout: ['📐', 'Layout'],
  LightningComponentBundle: ['🧱', 'LWC'],
  LightningMessageChannel: ['📡', 'Message channel'],
  FlexiPage: ['🖼️', 'Lightning page'],
  CustomTab: ['📑', 'Tab'],
  CustomApplication: ['📱', 'App'],
  StaticResource: ['🗃️', 'Static resource'],
  RecordType: ['🎟️', 'Record type'],
  ValidationRule: ['🚦', 'Validation rule'],
  CustomMetadata: ['📋', 'Metadata record'],
  Product2: ['🛒', 'Product'],
  Pricebook2: ['📒', 'Price book'],
  PricebookEntry: ['💶', 'Price book entry'],
  ProductFeature: ['🧩', 'Feature'],
  ProductOption: ['🔩', 'Option'],
  ProductRule: ['📏', 'Product rule'],
  ErrorCondition: ['❓', 'Error condition'],
  ProductAction: ['🎬', 'Product action'],
  ConfigurationRule: ['🔧', 'Configuration rule'],
  SummaryVariable: ['➕', 'Summary variable'],
  DiscountSchedule: ['📉', 'Discount schedule'],
  DiscountTier: ['🪜', 'Discount tier'],
  GlobalValueSet: ['🗂️', 'Global value set'],
  StandardValueSet: ['🗂️', 'Standard value set'],
  BusinessProcess: ['🛤️', 'Process'],
  PathAssistant: ['🧭', 'Path'],
  CustomPermission: ['🎫', 'Custom permission'],
  OpportunitySettings: ['🎛️', 'Opportunity settings'],
  Queue: ['📥', 'Queue'],
  QueueRoutingConfig: ['🔀', 'Routing config'],
  ServiceChannel: ['📞', 'Service channel'],
  ServicePresenceStatus: ['🟢', 'Presence status'],
  MilestoneType: ['⏱️', 'Milestone'],
  EntitlementProcess: ['📜', 'Entitlement process'],
  EntitlementTemplate: ['🧾', 'Entitlement template'],
  PlatformEventChannel: ['📡', 'Event channel'],
  PlatformEventChannelMember: ['📶', 'Channel member'],
  PlatformEventSubscriberConfig: ['👂', 'Subscriber config'],
  Package2Version: ['📦', 'Package version'],
  CustomSite: ['🌐', 'Site'],
  Network: ['🏘️', 'Experience site'],
  NavigationMenu: ['🧭', 'Navigation menu'],
  ExperienceBundle: ['🎨', 'Site pages'],
}

const kindOf = (item) => {
  if (item.kind === 'ApexClass' && /Test$/.test(item.name)) return ['🧪', 'Test class']
  return KINDS[item.kind] ?? ['📦', item.kind.replace(/([a-z])([A-Z])/g, '$1 $2')]
}

// Which crates of `order` land (true) or explode (false): a crate lands when every crate it needs
// has already landed.
function ship(order, byName) {
  const landed = new Set()
  return order.map((name) => {
    const ok = (byName[name].needs ?? []).every((n) => landed.has(n))
    if (ok) landed.add(name)
    return ok
  })
}

function shuffle(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// A dock order that would not deploy cleanly as it stands (when one can be found quickly).
function scramble(names, byName) {
  let out = shuffle(names)
  for (let i = 0; i < 40 && ship(out, byName).every(Boolean); i++) out = shuffle(names)
  return out
}

const calm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Crate({ item, state = '', slot, onClick, disabled, label, drag }) {
  const [icon, kind] = kindOf(item)
  return (
    <button type="button" className={`ar-conveyor-crate${state ? ` ${state}` : ''}`} onClick={onClick} disabled={disabled} aria-label={label} {...drag}>
      {slot != null && <b className="ar-conveyor-no" aria-hidden="true">{slot}</b>}
      <span className="ar-conveyor-icon" aria-hidden="true">{icon}</span>
      <small>{kind}</small>
      <strong>{item.name}</strong>
      {state === 'ok' && <i className="ar-conveyor-stamp" aria-hidden="true">✓</i>}
      {state === 'boom' && <i className="ar-conveyor-blast" aria-hidden="true">💥</i>}
      {state === 'missed' && <i className="ar-conveyor-stamp late" aria-hidden="true">⏰</i>}
    </button>
  )
}

export default function Conveyor({ round, done, onResult }) {
  const items = round.items
  const byName = useMemo(() => Object.fromEntries(items.map((i) => [i.name, i])), [items])
  const start = useMemo(() => scramble(items.map((i) => i.name), byName), [items, byName])
  const [belt, setBelt] = useState([])
  const [phase, setPhase] = useState('arrange') // arrange → deploying → landed
  const [left, setLeft] = useState(round.time)
  const [run, setRun] = useState(null) // { order, ok, missed }
  const [tick, setTick] = useState(0) // crate i rolls at 2i+1 and lands at 2i+2
  const [over, setOver] = useState(null) // slot index a crate is dragged over
  const reported = useRef(false)
  const locked = done || phase !== 'arrange'
  const dock = start.filter((n) => !belt.includes(n))
  const n = items.length

  function deploy() {
    if (phase !== 'arrange') return
    setRun({ order: belt, ok: ship(belt, byName), missed: dock })
    setTick(0)
    setPhase('deploying')
  }

  // Countdown; at zero the belt ships as it is.
  useEffect(() => {
    if (phase !== 'arrange' || done) return undefined
    if (left <= 0) {
      deploy()
      return undefined
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left, phase, done]) // eslint-disable-line react-hooks/exhaustive-deps

  // Roll the crates into Production one by one, then report the score once.
  useEffect(() => {
    if (phase !== 'deploying') return undefined
    if (tick >= run.order.length * 2) {
      setPhase('landed')
      if (!reported.current) {
        reported.current = true
        onResult(run.ok.filter(Boolean).length / n)
      }
      return undefined
    }
    const slow = calm() ? 0.25 : 1
    const t = setTimeout(() => setTick((k) => k + 1), (tick === 0 ? 450 : tick % 2 ? 380 : 300) * slow)
    return () => clearTimeout(t)
  }, [phase, tick, run]) // eslint-disable-line react-hooks/exhaustive-deps

  const place = (name, at = belt.length) => {
    if (locked) return
    setBelt((b) => {
      const rest = b.filter((x) => x !== name)
      const i = Math.min(at, rest.length)
      return [...rest.slice(0, i), name, ...rest.slice(i)]
    })
  }
  const pull = (name) => !locked && setBelt((b) => b.filter((x) => x !== name))

  const stateOf = (i) => {
    if (!run) return ''
    if (tick === 2 * i + 1) return 'rolling'
    if (tick >= 2 * i + 2) return run.ok[i] ? 'ok' : 'boom'
    return 'queued'
  }
  const resolved = run ? Math.max(0, Math.min(run.order.length, Math.floor(tick / 2))) : 0
  const landedN = run ? run.ok.slice(0, resolved).filter(Boolean).length : 0
  const failedN = run ? resolved - landedN + (phase === 'landed' ? run.missed.length : 0) : 0
  const last = resolved > 0 ? run.ok[resolved - 1] : null
  const urgent = phase === 'arrange' && left <= Math.max(5, Math.round(round.time / 5))

  const drag = (name) =>
    locked
      ? {}
      : {
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.setData('text/plain', name)
            e.dataTransfer.effectAllowed = 'move'
          },
          onDragEnd: () => setOver(null),
        }
  const dropOn = (at) =>
    locked
      ? {}
      : {
          onDragOver: (e) => {
            e.preventDefault()
            if (over !== at) setOver(at)
          },
          onDragLeave: () => setOver(null),
          onDrop: (e) => {
            e.preventDefault()
            setOver(null)
            const name = e.dataTransfer.getData('text/plain')
            if (!byName[name]) return
            if (at === 'dock') pull(name)
            else place(name, at)
          },
        }

  const shown = run ? run.order : belt
  return (
    <>
      <p className="ar-q">{round.q}</p>
      <div className={`ar-conveyor phase-${phase}`}>
        <div className="ar-conveyor-hud">
          <span className={`ar-conveyor-clock${urgent ? ' urgent' : ''}`} role="timer" aria-live="off">
            ⏱ <b>{phase === 'arrange' ? left : '—'}</b>{phase === 'arrange' && 's'}
          </span>
          <span className="ar-conveyor-fuse" aria-hidden="true">
            <i style={{ width: `${(Math.max(0, left) / round.time) * 100}%` }} className={urgent ? 'urgent' : ''} />
          </span>
          <span className="ar-conveyor-tally" aria-live="polite">
            <span className="ok">Deployed ✓ {landedN}</span>
            <span className="bad">Failed ✗ {failedN}</span>
          </span>
        </div>

        <div className="ar-conveyor-line">
          <ol className="ar-conveyor-belt" aria-label="Deploy order">
            {Array.from({ length: n }, (_, i) => {
              const name = shown[i]
              const next = phase === 'arrange' && i === belt.length
              return (
                <li key={i} className={`ar-conveyor-slot${name ? ' full' : ''}${next ? ' next' : ''}${over === i ? ' over' : ''}`} {...dropOn(i)}>
                  {name ? (
                    <Crate
                      key={name}
                      item={byName[name]}
                      slot={i + 1}
                      state={stateOf(i)}
                      disabled={locked}
                      onClick={() => pull(name)}
                      label={locked ? `${i + 1}. ${name}` : `${i + 1}. ${name}. Tap to pull it back`}
                      drag={drag(name)}
                    />
                  ) : (
                    <span className="ar-conveyor-empty"><b>{i + 1}</b>{next ? 'Next crate' : ''}</span>
                  )}
                </li>
              )
            })}
          </ol>
          <div className={`ar-conveyor-prod${last === true ? ' ok' : last === false ? ' boom' : ''}`} aria-hidden="true">
            <span className="ar-conveyor-factory" key={resolved}>🏭</span>
            <strong>Production</strong>
            <small>{phase === 'arrange' ? 'Waiting for crates' : phase === 'deploying' ? (last == null ? 'Deploy started…' : last ? 'Landed ✓' : 'Boom 💥') : `${landedN}/${n} deployed`}</small>
          </div>
        </div>

        {(dock.length > 0 || phase === 'arrange') && (
          <div className={`ar-conveyor-dock${over === 'dock' ? ' over' : ''}`} {...dropOn('dock')}>
            <span className="ar-conveyor-dock-label">{phase === 'arrange' ? '📥 Loading dock' : '⏰ Missed the deploy'}</span>
            <div className="ar-conveyor-pile">
              {dock.map((name) => (
                <Crate
                  key={name}
                  item={byName[name]}
                  state={phase === 'landed' ? 'missed' : ''}
                  disabled={locked}
                  onClick={() => place(name)}
                  label={locked ? name : `${name}. Tap to put it in slot ${belt.length + 1}`}
                  drag={drag(name)}
                />
              ))}
              {dock.length === 0 && <span className="ar-conveyor-done">All crates loaded. Ship it!</span>}
            </div>
          </div>
        )}

        {phase === 'arrange' && !done && (
          <div className="ar-conveyor-actions">
            <button type="button" className="btn btn-primary btn-sm ar-conveyor-deploy" onClick={deploy} disabled={dock.length > 0}>
              🚀 {dock.length > 0 ? `Load ${dock.length} more` : 'Deploy'}
            </button>
            <p className="ar-help">Tap crates in the order they should ship; tap one on the belt to pull it back (or drag to reorder). When the clock hits zero, the belt ships as it is.</p>
          </div>
        )}

        {done && (
          <div className="ar-conveyor-answer">
            <strong>✓ A clean deploy order</strong>
            <ol>
              {items.map((item) => {
                const [icon, kind] = kindOf(item)
                return (
                  <li key={item.name}>
                    <span aria-hidden="true">{icon}</span>
                    <div>
                      <b>{item.name}</b> <small>{kind}</small>
                      {item.needs?.length > 0 && <em>needs {item.needs.join(', ')}</em>}
                    </div>
                  </li>
                )
              })}
            </ol>
            <p>Any order works, as long as every crate ships after the crates it needs.</p>
          </div>
        )}
      </div>
    </>
  )
}
