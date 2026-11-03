// Languages and the UI-string dictionaries, as plain JS without React, so the PDF report (and a future
// learning site) can use them too. React components use useLang() from i18n.jsx instead.
import en from './strings.en.js'
import nl from './strings.nl.js'
import fr from './strings.fr.js'

export const LANGS = ['en', 'nl', 'fr']
export const DEFAULT_LANG = 'en'
// Each language's own name, for the language switch.
export const LANG_NAMES = { en: 'English', nl: 'Nederlands', fr: 'Français' }
// Locales for dates and numbers: Belgian Dutch and French, British English (as the copy is).
export const LOCALES = { en: 'en-GB', nl: 'nl-BE', fr: 'fr-BE' }
export const STRINGS = { en, nl, fr }

export const isLang = (l) => LANGS.includes(l)

// t(key, ...args): the string for `key` in `lang`, falling back to English. Function values are called with
// args (for counts and names); arrays and objects are returned as they are. A missing key returns the key.
export function makeT(lang) {
  const dict = STRINGS[lang] || en
  return (key, ...args) => {
    const v = dict[key] ?? en[key]
    if (v === undefined) {
      if (import.meta.env?.DEV) console.warn(`[i18n] missing string "${key}"`)
      return key
    }
    return typeof v === 'function' ? v(...args) : v
  }
}

// Intl uses a narrow no-break space (U+202F) in French; not every font has it, so use the plain one.
const nbsp = (s) => s.replace(/\u202f/g, '\u00a0')

// Whole euros in the language's format: €42,900 · € 42.900 · 42 900 €.
export function formatMoney(lang, n) {
  return nbsp(new Intl.NumberFormat(LOCALES[lang] || LOCALES.en, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n))
}

export function formatNumber(lang, n, digits = 0) {
  return nbsp(new Intl.NumberFormat(LOCALES[lang] || LOCALES.en, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n))
}
