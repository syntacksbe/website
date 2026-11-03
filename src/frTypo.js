// French typography for the fr copy: a no-break space before ? ! : ; % and », after «, and as the thousands
// separator (10 000), so a line never starts with a lone "?" or "000". Applied once to every string of a
// French dictionary (functions are wrapped, so their results get it too). U+00A0 is in the PDF's WinAnsi set.
const NBSP = ' '

export const frSpaces = (s) =>
  s
    .replace(/ ([?!:;%»])/g, `${NBSP}$1`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/(\d) (\d{3})\b/g, `$1${NBSP}$2`)

export function frTypo(value) {
  if (typeof value === 'string') return frSpaces(value)
  if (typeof value === 'function') return (...args) => frTypo(value(...args))
  if (Array.isArray(value)) return value.map(frTypo)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frTypo(v)]))
  return value
}
