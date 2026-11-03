import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as en from './content.js'
import * as nl from './content.nl.js'
import * as fr from './content.fr.js'
import { DEFAULT_LANG, LANG_NAMES, LANGS, LOCALES, formatMoney, formatNumber, isLang, makeT } from './strings.js'
import './i18n.css'

// The homepage in English (default), Dutch and French, without an i18n library.
// - The language comes from ?lang=en|nl|fr, then localStorage `syntacks-lang`, then the browser language.
// - useLang() gives { lang, setLang, t, locale, money, num }; t('key') looks up strings.<lang>.js.
// - useContent() gives the site copy: content.js (English) or content.nl.js / content.fr.js, same shape.
// Without a LangProvider (the Arcade), both fall back to English.

export { LANGS } from './strings.js'
const KEY = 'syntacks-lang'
const CONTENT = { en, nl, fr }

export function detectLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(KEY)
    if (isLang(saved)) return saved
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  const browser = String(navigator.languages?.[0] || navigator.language || '').toLowerCase()
  if (browser.startsWith('nl')) return 'nl'
  if (browser.startsWith('fr')) return 'fr'
  return DEFAULT_LANG
}

function valueFor(lang, setLang = () => {}) {
  return {
    lang,
    setLang,
    t: makeT(lang),
    locale: LOCALES[lang],
    money: (n) => formatMoney(lang, n),
    num: (n, digits) => formatNumber(lang, n, digits),
  }
}

const LangContext = createContext(valueFor(DEFAULT_LANG))

export function LangProvider({ children, initial }) {
  const [lang, setLangState] = useState(() => (isLang(initial) ? initial : detectLang()))

  const setLang = useCallback((next) => {
    if (!isLang(next)) return
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not remembered in a private window; the switch still works for this visit.
    }
    // A ?lang= in the address bar would win again on reload, so keep it in step.
    const url = new URL(window.location.href)
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', next)
      history.replaceState(history.state, '', url)
    }
  }, [])

  // A ?lang= link is a choice too: remember it for the next visit.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('lang')) return
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      // ignore
    }
  }, [lang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => valueFor(lang, setLang), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

export function useContent() {
  return CONTENT[useLang().lang] || en
}

// EN · NL · FR as a compact segmented control. Each button carries its language's own name as a tooltip and
// its `lang`, so screen readers say "NL" in Dutch.
// The compact version for a crowded header: one small picker instead of three buttons.
export function LangSelect({ className = '' }) {
  const { lang, setLang, t } = useLang()
  return (
    <label className={`lang-select ${className}`.trim()}>
      <span className="sr-only">{t('lang.label')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        {LANGS.map((l) => <option key={l} value={l} lang={l}>{l.toUpperCase()} · {LANG_NAMES[l]}</option>)}
      </select>
      <b aria-hidden="true">{lang.toUpperCase()}</b>
    </label>
  )
}

export function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label={t('lang.label')}>
      {LANGS.map((l, i) => (
        <span key={l} className="lang-switch-item">
          {i > 0 && <span className="lang-switch-dot" aria-hidden="true">·</span>}
          <button type="button" lang={l} title={LANG_NAMES[l]} aria-pressed={l === lang} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
