import { useState } from 'react'
import { beep, burst } from './fx.js'
import { GEARS_PER_STAR, GEARS_PER_TROPHY, ITEMS, KINDS, gearsText, useShop } from './shop.js'
import Avatar from './Avatar.jsx'
import Car from './Car.jsx'
import './extras.css'
import './shop.css'

// #/shop: spend gears (earned only in the Arcade) on how the Arcade looks: a page background, card borders,
// clothes and style for the character, a car and its paint and rims, or an extra radio station. Buying equips it;
// owned items can be switched any time here or on the profile.

// A small picture of what the item does. Clothes and car parts are shown on your own character and car.
function Preview({ item, profile }) {
  if (item.kind === 'outfit') {
    const look = { ...profile.avatar, [item.slot]: item.value }
    // A hair dye needs hair to show on.
    if (item.slot === 'hairColor' && ['bald', 'buzz'].includes(look.hair)) look.hair = 'crop'
    return (
      <span className="ar-shop-preview ar-part-look" aria-hidden="true">
        <Avatar look={look} />
      </span>
    )
  }
  if (item.kind === 'car') {
    return (
      <span className="ar-shop-preview ar-part-look car" aria-hidden="true">
        <Car garage={{ ...profile.garage, [item.slot]: item.value }} />
      </span>
    )
  }
  if (item.kind === 'background') {
    return (
      <span className={`ar-shop-preview ar-bg-look look-${item.look}`} aria-hidden="true">
        <i /><i /><i />
      </span>
    )
  }
  if (item.kind === 'border') {
    return (
      <span className="ar-shop-preview ar-border-look" data-border={item.look} aria-hidden="true">
        <span className="ar-mini-tile"><b /><b /><b /></span>
      </span>
    )
  }
  return (
    <span className="ar-shop-preview ar-radio-look" aria-hidden="true">
      <span>📻</span><b>{item.name.split(' ').pop()}</b>
    </span>
  )
}

function Item({ item, shop, onBought }) {
  const owned = shop.owns(item)
  const on = shop.isEquipped(item)
  const short = item.price - shop.gears
  return (
    <li className={`ar-shop-item${owned ? ' owned' : ''}${on ? ' on' : ''}`}>
      <Preview item={item} profile={shop.profile} />
      <strong>{item.name}</strong>
      <small>{item.text}</small>
      <div className="ar-shop-foot">
        <span className="ar-shop-price">{item.price === 0 ? 'Free' : owned && !shop.profile.shop.owned.includes(item.id) ? 'Cheat unlock' : gearsText(item.price)}</span>
        {!owned ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={short > 0} onClick={() => shop.buy(item) && onBought(item)}>
            {short > 0 ? `${gearsText(short)} to go` : 'Buy'}
          </button>
        ) : item.kind === 'radio' ? (
          <span className="ar-shop-state">✓ On your dial</span>
        ) : on ? (
          <span className="ar-shop-state">✓ {item.kind === 'outfit' ? 'Wearing' : 'Equipped'}</span>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { shop.equip(item); beep('tick') }}>Equip</button>
        )}
      </div>
    </li>
  )
}

export default function Shop({ progress }) {
  const shop = useShop(progress)
  const [bought, setBought] = useState(null)
  const onBought = (item) => {
    setBought(item)
    beep('win')
    burst({ count: 24 })
  }

  return (
    <div className="container ar-x-page ar-shop">
      <nav className="ar-crumbs" aria-label="Breadcrumb"><a href="#/">← Catalog</a></nav>
      <header className="ar-x-head ar-shop-head">
        <div>
          <p className="kicker">Arcade shop</p>
          <h1>Spend your gears</h1>
          <p>
            Gears come only from playing the Arcade: {GEARS_PER_STAR} per star and {GEARS_PER_TROPHY} per trophy. They’re a game score, not money.
            Nothing here costs or pays anything real.
          </p>
        </div>
        <div className="ar-shop-wallet" role="status">
          <small>Your gears</small>
          <strong key={shop.gears}><span aria-hidden="true">⚙</span> {shop.gears.toLocaleString('en-US')}<span className="sr-only"> gears</span></strong>
          <span>⭐ {shop.stars} stars · 🏅 {shop.trophies} trophies · {gearsText(shop.spent)} spent</span>
          <a href="#/profile">👤 Your profile →</a>
        </div>
      </header>
      {bought && <p className="ar-shop-bought" role="status">✓ {bought.name} is yours{bought.kind === 'radio' ? ': tune in on the FM dial.' : bought.slot ? '. See it on your profile.' : ' and equipped.'}</p>}

      {KINDS.map((k) => (
        <section className="ar-x-shelf" key={k.id}>
          <header>
            <h2>{k.title}</h2>
          </header>
          <p className="ar-x-shelf-note">{k.note}</p>
          <ul className="ar-shop-items">
            {ITEMS.filter((i) => i.kind === k.id).map((item) => <Item key={item.id} item={item} shop={shop} onBought={onBought} />)}
          </ul>
        </section>
      ))}
      <p className="ar-help ar-x-note">Short on gears? Play a few games: every star counts. <a href="#/">Back to the catalog</a></p>
    </div>
  )
}
