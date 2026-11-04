import { useEffect, useRef, useState } from 'react'
import { LangSelect, LangSwitch, useLang } from '../i18n.jsx'
import Logo from './Logo.jsx'
import RadioDial from './RadioDial.jsx'
import { GtaMenuItems } from '../gta/GtaLayer.jsx'
import { POSTS } from '../blog/posts.index.js'

// The site menu, shared with the Arcade and the patch-notes pages (which point the section links back to the
// homepage). The homepage sections come first; the patch notes and the Arcade are their own pages, so they go last.
export const SITE_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#certifications', label: 'Certifications', minor: true },
  { href: '#experience', label: 'Experience', minor: true },
  { href: '#health-check', label: 'Health check' },
  { href: 'blog/', label: 'Patch notes' },
  { href: 'arcade/', label: 'Arcade' },
]

// How many releases the menus list under "Patch notes" before "All releases".
const RECENT = 3

// The "Patch notes" item of the header: a link to the list of releases, with the latest ones in a panel that
// opens on hover or keyboard focus. `base` prefixes the links ('' on the homepage, '../' in the Arcade, the
// absolute base on the blog pages); `current` is the slug of the open post, or 'index' on the list.
export function PatchNotesMenu({ base = '', current }) {
  return (
    <div className="nav-drop">
      <a href={`${base}blog/`} aria-current={current ? 'page' : undefined}>
        Patch notes <span className="nav-caret" aria-hidden="true" />
      </a>
      <div className="nav-drop-panel">
        {POSTS.slice(0, RECENT).map((p) => (
          <a key={p.slug} href={`${base}blog/${p.slug}/`} aria-current={current === p.slug ? 'page' : undefined}>
            <b>{p.title}</b>
            <small>v{p.version} · {p.tagline}</small>
          </a>
        ))}
        <a className="nav-drop-all" href={`${base}blog/`}>All releases →</a>
      </div>
    </div>
  )
}

// The same for the phone menu: "Patch notes", then the latest releases indented under it.
export function patchNotesLinks(links, base = '', current) {
  return links.flatMap((l) =>
    l.href.endsWith('blog/')
      ? [
          { ...l, current: current === 'index' },
          ...POSTS.slice(0, RECENT).map((p) => ({ href: `${base}blog/${p.slug}/`, label: p.title, sub: true, current: current === p.slug })),
        ]
      : [l],
  )
}

// The logo goes to the homepage itself: from a section link (/website/#experience) it drops the hash and
// returns to the top without reloading the page.
function goHome(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  history.pushState(null, '', import.meta.env.BASE_URL)
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

// Phones have no room for the menu links, so a menu button opens them as a panel under the header.
// `links` are { href, label, current }; picking one, Escape or a tap outside closes the panel.
export function MenuButton({ links, children }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="menu" ref={root}>
      <button type="button" className={`menu-btn${open ? ' open' : ''}`} aria-expanded={open} aria-controls="menu-panel" onClick={() => setOpen((o) => !o)}>
        <span className="sr-only">Menu</span>
        <i aria-hidden="true" />
      </button>
      {open && (
        <nav className="menu-panel" id="menu-panel" aria-label="Menu">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={l.sub ? 'sub' : undefined} aria-current={l.current ? 'page' : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          {children}
        </nav>
      )}
    </div>
  )
}

// The header's own words; the section names come from the mini-map labels so both always match.
const NAV_TEXT = {
  en: { talk: "Let's talk", home: 'Syntacks home' },
  // "Gezondheidscheck" is too long for the header row next to the Dutch button.
  nl: { talk: 'Laten we praten', home: 'Syntacks home', short: { 'health-check': 'Org-check' } },
  fr: { talk: 'Parlons-en', home: 'Accueil Syntacks' },
}

export default function Nav() {
  const { lang, t } = useLang()
  const text = NAV_TEXT[lang]
  const spots = t('map.spots')
  const links = SITE_LINKS.map((l) => ({ ...l, label: text.short?.[l.href.slice(1)] ?? spots[l.href.slice(1)] ?? l.label }))

  return (
    <header className="nav" id="top">
      <div className="container nav-inner">
        <a href={import.meta.env.BASE_URL} className="logo" aria-label={text.home} onClick={goHome}>
          <Logo />
        </a>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) =>
            l.href === 'blog/' ? (
              <PatchNotesMenu key={l.href} />
            ) : (
              <a key={l.href} href={l.href} className={l.minor ? 'minor' : undefined}>{l.label}</a>
            ),
          )}
        </nav>
        <div className="nav-right">
          <RadioDial />
          <LangSelect className="nav-lang" />
          <a href="#contact" className="btn btn-primary btn-sm">{text.talk}</a>
          <MenuButton links={patchNotesLinks(links)}>
            <GtaMenuItems page="home" />
            <LangSwitch className="menu-lang" />
          </MenuButton>
        </div>
      </div>
      <span className="scroll-progress" aria-hidden="true" />
    </header>
  )
}
