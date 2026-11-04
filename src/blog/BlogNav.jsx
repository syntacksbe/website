import Logo from '../components/Logo.jsx'
import RadioDial from '../components/RadioDial.jsx'
import { MenuButton, PatchNotesMenu, SITE_LINKS, patchNotesLinks } from '../components/Nav.jsx'

// The header of the patch-notes pages: the same menu as the homepage, with every link absolute because the
// posts live two folders deep (/website/blog/<slug>/). The blog is English only, so no language switch.
export default function BlogNav() {
  const base = import.meta.env.BASE_URL
  const slug = window.location.pathname.slice(base.length).replace(/^blog\/?/, '').replace(/\/$/, '')
  const links = SITE_LINKS.map((l) => ({ ...l, href: `${base}${l.href}`, current: l.href === 'blog/' }))

  return (
    <header className="nav" id="top">
      <div className="container nav-inner">
        <a href={base} className="logo" aria-label="Syntacks home">
          <Logo />
        </a>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) =>
            l.href.endsWith('blog/') ? (
              <PatchNotesMenu key={l.href} base={base} current={slug || 'index'} />
            ) : (
              <a key={l.href} href={l.href} className={l.minor ? 'minor' : undefined}>{l.label}</a>
            ),
          )}
        </nav>
        <div className="nav-right">
          <RadioDial />
          <a href={`${base}#contact`} className="btn btn-primary btn-sm">Let's talk</a>
          <MenuButton links={patchNotesLinks(links, base, slug || 'index')} />
        </div>
      </div>
    </header>
  )
}
