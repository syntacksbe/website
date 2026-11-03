import { useLang } from '../i18n.jsx'
import { GTA_TEXT } from './strings.js'

export { GTA_TEXT } from './strings.js'

// The GTA layer's words in the page language (English on the Arcade, which has no language switch).
export function useGtaText() {
  const { lang } = useLang()
  return GTA_TEXT[lang] ?? GTA_TEXT.en
}
