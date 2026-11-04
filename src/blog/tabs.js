// The sections of a patch-notes post as tabs, GTA-style: one panel at a time, switched by clicking a tab, with the
// arrow keys or Q / E, or by swiping on a phone. The hash remembers the open section (#apex), so links into a
// section still work. Without this script every section is visible, which is what crawlers get.
import { NAV_KEYS, resolveKeyboard } from '../arcade/profile.js'

export function setupTabs() {
  const list = document.querySelector('.pn-tabs-list')
  const panels = [...document.querySelectorAll('.pn-section')]
  if (!list || panels.length < 2) return
  const tabs = [...list.querySelectorAll('[role="tab"]')]
  const ids = panels.map((p) => p.id)
  const wrap = document.querySelector('.pn-tabs-wrap')
  document.querySelector('.pn').classList.add('has-tabs')
  let current = -1
  // Which letters flip the tabs: from the keyboard setting in the Arcade profile (QWERTY Q / E, AZERTY A / E,
  // arrows only for other layouts). The badges on the strip show the result.
  let keys = NAV_KEYS.qwerty
  resolveKeyboard().then((layout) => {
    keys = NAV_KEYS[layout] || NAV_KEYS.other
    document.querySelectorAll('[data-key]').forEach((el) => {
      const k = keys[el.dataset.key === 'prev' ? 0 : 1]
      el.textContent = k ? k.toUpperCase() : el.dataset.key === 'prev' ? '←' : '→'
    })
  })

  // Keeps the open tab in the middle of the strip on phones, where it scrolls sideways. Only the strip moves,
  // never the page (scrollIntoView would also scroll vertically on load).
  const center = (index, behavior = 'instant') => {
    const t = tabs[index]
    list.scrollTo({ left: t.offsetLeft - list.clientWidth / 2 + t.offsetWidth / 2, behavior })
  }

  const show = (index, { push = true, focusTab = false } = {}) => {
    index = (index + ids.length) % ids.length
    if (index === current) return
    const dir = index > current ? 1 : -1
    current = index
    panels.forEach((p, i) => {
      p.classList.toggle('is-active', i === index)
      if (i === index) {
        p.classList.remove('from-left', 'from-right')
        void p.offsetWidth // restart the slide
        p.classList.add(dir > 0 ? 'from-right' : 'from-left')
      }
    })
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === index))
      t.tabIndex = i === index ? 0 : -1
    })
    center(index, 'smooth')
    if (focusTab) tabs[index].focus({ preventScroll: true })
    if (push) history.replaceState(null, '', `#${ids[index]}`)
    const count = document.querySelector('.pn-tabs-count [data-current]')
    if (count) count.textContent = index + 1
    // Reading further down a long section, a switch brings the strip back into view.
    const top = wrap.getBoundingClientRect().top
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 72, behavior: 'instant' })
  }

  const fades = () => {
    wrap.classList.toggle('can-left', list.scrollLeft > 4)
    wrap.classList.toggle('can-right', list.scrollLeft + list.clientWidth < list.scrollWidth - 4)
  }
  list.addEventListener('scroll', fades, { passive: true })
  window.addEventListener('resize', fades)
  fades()

  const fromHash = () => {
    const i = ids.indexOf(decodeURIComponent(location.hash.slice(1)))
    show(i >= 0 ? i : 0, { push: false })
  }
  fromHash()
  document.fonts?.ready.then(() => { center(current); fades() }) // the tabs are wider once Anton has loaded
  window.addEventListener('hashchange', fromHash)

  // Clicks on a tab or on the previous / next links at the end of a panel.
  document.addEventListener('click', (e) => {
    const arrow = e.target.closest('.pn-arrow')
    if (arrow) return show(current + Number(arrow.dataset.dir))
    const a = e.target.closest('.pn-tabs-list a, .pn-section-nav a')
    if (!a) return
    const i = ids.indexOf(a.getAttribute('href').slice(1))
    if (i < 0) return
    e.preventDefault()
    show(i, { focusTab: a.matches('.pn-tabs-list a') })
  })

  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || typing(e) || document.querySelector('.pn-deck')) return // the card deck has its own keys
    const k = e.key.toLowerCase()
    if (k === 'arrowright' || (keys[1] && k === keys[1])) show(current + 1, { focusTab: k === 'arrowright' })
    else if (k === 'arrowleft' || (keys[0] && k === keys[0])) show(current - 1, { focusTab: k === 'arrowleft' })
    else if (k === 'home' && e.target.matches('[role="tab"]')) show(0, { focusTab: true })
    else if (k === 'end' && e.target.matches('[role="tab"]')) show(ids.length - 1, { focusTab: true })
    else return
    e.preventDefault()
  })

  // A horizontal swipe on the panels, long enough and flatter than it is tall.
  let start = null
  const panelsEl = document.querySelector('.pn-panels')
  panelsEl.addEventListener('touchstart', (e) => { start = { x: e.touches[0].clientX, y: e.touches[0].clientY } }, { passive: true })
  panelsEl.addEventListener('touchend', (e) => {
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    start = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1))
  })
}
