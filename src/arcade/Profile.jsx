import { useEffect, useState } from 'react'
import { beep, burst, setSound, soundOn } from './fx.js'
import { clearProfile, fullName, saveProfile } from './profile.js'
import { rankFor } from './progress.js'
import { ITEMS, gearsText, itemById, ownsPart, useShop } from './shop.js'
import { SLOTS, TABS, cleanPlate, option, partItemId, slotById } from './avatarParts.js'
import Avatar from './Avatar.jsx'
import Car from './Car.jsx'
import './extras.css'
import './shop.css'

// #/profile: your character and car (a character creator in tabs, like a game's), who you are (name, role,
// company), how your Arcade looks, and your settings. Saved in this browser for now (profile.js); nothing is sent.
// Paid parts can be tried on: they show on the stage but are only saved once bought.
const FIELDS = [
  { id: 'firstName', label: 'First name', auto: 'given-name' },
  { id: 'lastName', label: 'Last name', auto: 'family-name' },
  { id: 'role', label: 'Role', auto: 'organization-title', placeholder: 'e.g. Salesforce admin' },
  { id: 'company', label: 'Company', auto: 'organization' },
]
const DJ_KEY = 'syntacks-radio-dj'

function readDj() {
  try {
    return localStorage.getItem(DJ_KEY) !== 'off'
  } catch {
    return true
  }
}

function Toggle({ label, note, on, onFlip }) {
  return (
    <div className="ar-pf-setting">
      <span><strong>{label}</strong><small>{note}</small></span>
      <button type="button" role="switch" aria-checked={on} className="ar-pf-switch" onClick={onFlip}>{on ? 'On' : 'Off'}</button>
    </div>
  )
}

// One choice in the creator: ◀ name ▶ for styles, a row of swatches for colours.
function Row({ slot, value, onPick, profile }) {
  const opts = slot.options
  const i = Math.max(0, opts.findIndex((o) => o.id === value))
  const step = (d) => onPick(slot.id, opts[(i + d + opts.length) % opts.length].id)
  if (slot.swatch) {
    return (
      <div className="ar-cc-row ar-cc-colors">
        <span className="ar-cc-label">{slot.label}<small>{opts[i].name}</small></span>
        <div role="radiogroup" aria-label={slot.label}>
          {opts.map((o) => (
            <button
              type="button" role="radio" key={o.id} aria-checked={o.id === value} aria-label={o.name} title={o.name}
              className={`${o.id === 'chrome' || o.id === 'chameleon' ? `sw-${o.id}` : ''}${ownsPart(profile, slot.id, o.id) ? '' : ' locked'}`}
              style={{ '--sw': o.color }} onClick={() => onPick(slot.id, o.id)}
            />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="ar-cc-row">
      <span className="ar-cc-label">{slot.label}</span>
      <div className="ar-cc-step">
        <button type="button" aria-label={`Previous ${slot.label.toLowerCase()}`} onClick={() => step(-1)}>◀</button>
        <output aria-live="polite">
          {ownsPart(profile, slot.id, opts[i].id) ? '' : '🔒 '}{opts[i].name}<small>{i + 1}/{opts.length}</small>
        </output>
        <button type="button" aria-label={`Next ${slot.label.toLowerCase()}`} onClick={() => step(1)}>▶</button>
      </div>
    </div>
  )
}

// A paid part you're trying on: buy it, or see how many gears you still need.
function Locked({ slot, value, shop, onBuy }) {
  const item = itemById(partItemId(slot.id, value))
  const short = item.price - shop.gears
  return (
    <div className="ar-cc-lock" role="status">
      <span><b>🔒 <strong>{item.name}</strong> · {gearsText(item.price)}</b><small>Trying it on. It's saved once you buy it.</small></span>
      <button type="button" className="btn btn-primary btn-sm" disabled={short > 0} onClick={() => onBuy(item)}>
        {short > 0 ? `${gearsText(short)} to go` : 'Buy'}
      </button>
    </div>
  )
}

function Creator({ shop, tryOn, setTryOn }) {
  const [tab, setTab] = useState('body')
  const { profile } = shop
  const [plate, setPlate] = useState(profile.garage.plate)
  useEffect(() => setPlate(profile.garage.plate), [profile.garage.plate])
  const value = (slot) => tryOn[slot.id] ?? profile[slot.store][slot.id]
  const without = (id) => Object.fromEntries(Object.entries(tryOn).filter(([k]) => k !== id))

  const pick = (id, v) => {
    beep('tick')
    if (!ownsPart(profile, id, v)) return setTryOn({ ...tryOn, [id]: v })
    setTryOn(without(id))
    saveProfile({ [slotById(id).store]: { [id]: v } })
  }
  const buy = (item) => {
    if (!shop.buy(item)) return
    setTryOn(without(item.slot))
    beep('win')
    burst({ count: 22 })
  }
  // Random picks from what you own, for the character or (on the Garage tab) the car.
  const store = tab === 'garage' ? 'garage' : 'avatar'
  const randomise = () => {
    const picks = Object.fromEntries(SLOTS.filter((s) => s.store === store).map((s) => {
      const mine = s.options.filter((o) => ownsPart(profile, s.id, o.id))
      return [s.id, mine[Math.floor(Math.random() * mine.length)].id]
    }))
    setTryOn(Object.fromEntries(Object.entries(tryOn).filter(([k]) => slotById(k).store !== store)))
    saveProfile({ [store]: picks })
    beep('good')
  }
  const slots = SLOTS.filter((s) => s.tab === tab)
  const onKey = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!d) return
    const i = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(i + d + TABS.length) % TABS.length].id
    setTab(next)
    document.getElementById(`ar-cc-tab-${next}`)?.focus()
  }

  return (
    <div className="ar-cc-panel">
      <div className="ar-cc-tabs" role="tablist" aria-label="Character creator" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button
            type="button" role="tab" key={t.id} id={`ar-cc-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="ar-cc-rows"
            tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="ar-cc-rows" id="ar-cc-rows" role="tabpanel" aria-labelledby={`ar-cc-tab-${tab}`}>
        {slots.map((s) => (
          <div key={s.id}>
            <Row slot={s} value={value(s)} onPick={pick} profile={profile} />
            {!ownsPart(profile, s.id, value(s)) && <Locked slot={s} value={value(s)} shop={shop} onBuy={buy} />}
          </div>
        ))}
        {tab === 'garage' && (
          <label className="ar-cc-row ar-cc-plate">
            <span className="ar-cc-label">Plate<small>Up to 8 letters and digits</small></span>
            <input
              value={plate} placeholder="ARCADE 1" spellCheck={false} autoComplete="off"
              onChange={(e) => { const p = cleanPlate(e.target.value); setPlate(p); saveProfile({ garage: { plate: p } }) }}
            />
          </label>
        )}
      </div>
      <div className="ar-cc-tools">
        <button type="button" className="btn btn-ghost btn-sm" onClick={randomise}>🎲 Random {store === 'garage' ? 'car' : 'look'}</button>
        <a href="#/shop">More clothes and cars in the shop →</a>
      </div>
    </div>
  )
}

export default function Profile({ progress }) {
  const shop = useShop(progress)
  const { info } = shop.profile
  const [form, setForm] = useState(info)
  const [status, setStatus] = useState('')
  const [sound, setSoundState] = useState(soundOn)
  const [dj, setDj] = useState(readDj)
  const [sure, setSure] = useState(false)
  const [tryOn, setTryOn] = useState({})
  const rank = rankFor(shop.stars)
  const name = fullName(info)
  const dirty = FIELDS.some((f) => (form[f.id] ?? '') !== (info[f.id] ?? ''))

  // A save or a clear elsewhere refreshes the form; typing isn't lost when only the look changes.
  const infoKey = JSON.stringify(info)
  useEffect(() => setForm(JSON.parse(infoKey)), [infoKey])

  const save = (e) => {
    e.preventDefault()
    const clean = Object.fromEntries(FIELDS.map((f) => [f.id, (form[f.id] ?? '').trim().slice(0, 60)]))
    saveProfile({ info: clean })
    setStatus('Saved in this browser.')
    beep('good')
  }

  const flipDj = () => {
    const next = !dj
    setDj(next)
    try {
      localStorage.setItem(DJ_KEY, next ? 'on' : 'off')
    } catch {
      // Ignore.
    }
    window.dispatchEvent(new Event('syntacks-radio-dj'))
  }

  const owned = (kind) => ITEMS.filter((i) => i.kind === kind && shop.owns(i))
  // What the stage shows: the saved character and car, plus any paid part being tried on.
  const pickOf = (store) => Object.fromEntries(Object.entries(tryOn).filter(([k]) => slotById(k).store === store))
  const look = { ...shop.profile.avatar, ...pickOf('avatar') }
  const garage = { ...shop.profile.garage, ...pickOf('garage') }

  return (
    <div className="container ar-x-page ar-profile">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>

      <section className="ar-cc" aria-label="Your character">
        <div className="ar-cc-stage">
          <div className="ar-pf-who">
            <p className="kicker">Your profile</p>
            <h1>{name || 'Player one'}</h1>
            <p>{[info.role, info.company].filter(Boolean).join(' · ') || 'Add your name, role and company below.'}</p>
          </div>
          <div className="ar-cc-scene">
            <Car key={garage.car} garage={garage} className="ar-cc-car" title={`${option('car', garage.car).name}, ${option('paint', garage.paint).name.toLowerCase()} paint`} />
            <span className="ar-plate" aria-label={`Plate ${garage.plate || 'ARCADE 1'}`}>{garage.plate || 'ARCADE 1'}</span>
            <Avatar look={look} className="ar-cc-avatar" title="Your character" />
          </div>
          <dl className="ar-pf-stats">
            <div><dt>Rank</dt><dd>{rank.name}</dd></div>
            <div><dt>Stars</dt><dd>⭐ {shop.stars}</dd></div>
            <div><dt>Trophies</dt><dd>🏅 {shop.trophies}</dd></div>
            <div><dt>Gears</dt><dd><a href="#/shop">{gearsText(shop.gears)}</a></dd></div>
          </dl>
        </div>
        <Creator shop={shop} tryOn={tryOn} setTryOn={setTryOn} />
      </section>

      <div className="ar-pf-grid">
        <form className="ar-pf-panel" onSubmit={save}>
          <h2>Personal info</h2>
          <p className="ar-pf-note">Saved in this browser only, for now. Nothing is sent anywhere.</p>
          <div className="ar-pf-fields">
            {FIELDS.map((f) => (
              <label key={f.id}>
                <span>{f.label}</span>
                <input
                  value={form[f.id] ?? ''} maxLength={60} autoComplete={f.auto} placeholder={f.placeholder}
                  onChange={(e) => { setForm({ ...form, [f.id]: e.target.value }); setStatus('') }}
                />
              </label>
            ))}
          </div>
          <div className="ar-pf-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!dirty}>Save</button>
            <span role="status">{status}</span>
          </div>
        </form>

        <section className="ar-pf-panel">
          <h2>Arcade look</h2>
          <p className="ar-pf-note">The page and card style, from what you own. <a href="#/shop">More in the shop →</a></p>
          {['background', 'border'].map((kind) => (
            <div className="ar-pf-look" key={kind} role="radiogroup" aria-label={kind === 'background' ? 'Background' : 'Card border'}>
              <span className="ar-pf-look-title">{kind === 'background' ? 'Background' : 'Card border'}</span>
              <div>
                {owned(kind).map((item) => (
                  <button
                    type="button" role="radio" key={item.id} aria-checked={shop.isEquipped(item)}
                    onClick={() => { shop.equip(item); beep('tick') }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="ar-pf-panel">
          <h2>Settings</h2>
          <Toggle label="Sound effects" note="Short synth sounds in the games." on={sound} onFlip={() => { setSound(!sound); setSoundState(!sound) }} />
          <Toggle label="Radio DJ & ads" note="Spoken lines and fake ads between songs on Syntacks FM." on={dj} onFlip={flipDj} />
          <div className="ar-pf-danger">
            {sure ? (
              <>
                <p>Clear your name, role, company, character, car, purchases and look? Your stars and trophies stay.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { clearProfile(); setTryOn({}); setSure(false); setStatus('') }}>Yes, clear it</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSure(false)}>Keep it</button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSure(true)}>Clear my profile</button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
