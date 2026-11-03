// Checks the Dutch and French homepage copy against the English source:
// - strings.<lang>.js: the same keys as strings.en.js, of the same kind (text, list of the same length, map with
//   the same keys, or a function that returns text);
// - content.<lang>.js: the same exports and shape as content.js, with ids, icons, links, numbers and rarities unchanged;
// - gta/strings.js: the GTA layer (pause menu, wheels, chase, crew...) has the same keys in nl and fr as in en;
// - healthChecks.<lang>.js: text for every area and check, an `na` label exactly where English has one, and
//   `where` lists of the same length.
// Run: node scripts/check-i18n.mjs
import * as enContent from '../src/content.js'
import * as nlContent from '../src/content.nl.js'
import * as frContent from '../src/content.fr.js'
import { STRINGS } from '../src/strings.js'
import { AREAS } from '../src/healthChecks.js'
import nlHealth from '../src/healthChecks.nl.js'
import frHealth from '../src/healthChecks.fr.js'
import { GTA_TEXT } from '../src/gta/strings.js'

const problems = []
const fail = (msg) => problems.push(msg)
const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)
// Keys whose string values are data, not copy: they must stay exactly as in English.
const FIXED = new Set(['id', 'icon', 'href', 'rarity', 'name', 'short'])

function sameShape(a, b, path, { fixedNames = false } = {}) {
  if (kind(a) !== kind(b)) return fail(`${path}: ${kind(b)} instead of ${kind(a)}`)
  if (Array.isArray(a)) {
    if (a.length !== b.length) return fail(`${path}: ${b.length} items instead of ${a.length}`)
    a.forEach((v, i) => sameShape(v, b[i], `${path}[${i}]`, { fixedNames }))
  } else if (a && typeof a === 'object') {
    const ka = Object.keys(a).sort().join()
    const kb = Object.keys(b).sort().join()
    if (ka !== kb) return fail(`${path}: keys [${kb}] instead of [${ka}]`)
    for (const k of Object.keys(a)) {
      const fixed = FIXED.has(k) && (k !== 'name' && k !== 'short' ? true : fixedNames)
      if (fixed && a[k] !== b[k]) fail(`${path}.${k}: "${b[k]}" should stay "${a[k]}"`)
      else sameShape(a[k], b[k], `${path}.${k}`, { fixedNames })
    }
  } else if (typeof a === 'string') {
    if (!b.trim()) fail(`${path}: empty`)
  } else if (a !== b) {
    fail(`${path}: ${JSON.stringify(b)} instead of ${JSON.stringify(a)}`)
  }
}

// Strings
const en = STRINGS.en
for (const lang of ['nl', 'fr']) {
  const dict = STRINGS[lang]
  for (const key of Object.keys(en)) {
    if (!(key in dict)) {
      fail(`strings.${lang}: missing "${key}"`)
      continue
    }
    const a = en[key]
    const b = dict[key]
    if (typeof a === 'function') {
      if (typeof b !== 'function') fail(`strings.${lang}.${key}: should be a function`)
      else for (const args of [[0, 0, 0], [1, 1, 1], [7, 30, 2]]) {
        const out = b(...args)
        if (typeof out !== 'string' || out.includes('undefined')) fail(`strings.${lang}.${key}(${args}) → ${out}`)
      }
    } else {
      sameShape(a, b, `strings.${lang}.${key}`)
    }
  }
  for (const key of Object.keys(dict)) if (!(key in en)) fail(`strings.${lang}: "${key}" is not in strings.en.js`)
}

// Content
for (const [lang, content] of [['nl', nlContent], ['fr', frContent]]) {
  const ka = Object.keys(enContent).sort().join()
  const kb = Object.keys(content).sort().join()
  if (ka !== kb) fail(`content.${lang}: exports [${kb}] instead of [${ka}]`)
  for (const k of Object.keys(enContent)) {
    if (k in content) sameShape(enContent[k], content[k], `content.${lang}.${k}`, { fixedNames: k === 'certifications' })
  }
}

// Health check
for (const [lang, o] of [['nl', nlHealth], ['fr', frHealth]]) {
  for (const sev of ['critical', 'high', 'medium']) if (!o.severity?.[sev]) fail(`healthChecks.${lang}: severity.${sev} missing`)
  for (const g of ['good', 'warn', 'bad']) {
    for (const f of ['label', 'stamp', 'text']) if (!o.grades?.[g]?.[f]) fail(`healthChecks.${lang}: grades.${g}.${f} missing`)
  }
  if (!o.grades?.warn?.critical) fail(`healthChecks.${lang}: grades.warn.critical missing`)
  const ids = new Set()
  for (const a of AREAS) {
    if (!o.areas?.[a.id]?.name || !o.areas?.[a.id]?.intro) fail(`healthChecks.${lang}: area ${a.id} needs name and intro`)
    for (const c of a.checks) {
      ids.add(c.id)
      const t = o.checks?.[c.id]
      if (!t) {
        fail(`healthChecks.${lang}: check ${c.id} missing`)
        continue
      }
      for (const f of ['topic', 'check', 'why', 'fix']) if (!t[f]) fail(`healthChecks.${lang}.${c.id}: ${f} missing`)
      if (Boolean(c.na) !== Boolean(t.na)) fail(`healthChecks.${lang}.${c.id}: na ${c.na ? 'missing' : 'not in English'}`)
      if (t.where && t.where.length !== c.where.length) fail(`healthChecks.${lang}.${c.id}: where has ${t.where.length} items instead of ${c.where.length}`)
    }
  }
  for (const id of Object.keys(o.checks || {})) if (!ids.has(id)) fail(`healthChecks.${lang}: check ${id} is not in healthChecks.js`)
  for (const id of Object.keys(o.areas || {})) if (!AREAS.some((a) => a.id === id)) fail(`healthChecks.${lang}: area ${id} is not in healthChecks.js`)
}

// GTA layer: same shape in every language; functions must return text.
function sameGta(a, b, path) {
  if (typeof a === 'function') {
    if (typeof b !== 'function') return fail(`${path}: should be a function`)
    const sample = { name: 'Apex FM', tagline: 'Bulkified synthwave', freq: '101.3' }
    const args = path.includes('.radio.') ? [sample] : [2, 150] // DJ lines take a station, the rest numbers
    const out = b(...args)
    if (typeof out !== 'string' || out.includes('undefined')) fail(`${path}(${JSON.stringify(args)}) → ${out}`)
    return
  }
  if (kind(a) !== kind(b)) return fail(`${path}: ${kind(b)} instead of ${kind(a)}`)
  if (Array.isArray(a)) {
    if (a.length !== b.length) return fail(`${path}: ${b.length} items instead of ${a.length}`)
    return a.forEach((v, i) => sameGta(v, b[i], `${path}[${i}]`))
  }
  if (a && typeof a === 'object') {
    const ka = Object.keys(a).sort().join()
    const kb = Object.keys(b).sort().join()
    if (ka !== kb) return fail(`${path}: keys [${kb}] instead of [${ka}]`)
    return Object.keys(a).forEach((k) => sameGta(a[k], b[k], `${path}.${k}`))
  }
  if (typeof a === 'string' && !b.trim()) fail(`${path}: empty`)
}
for (const lang of ['nl', 'fr']) sameGta(GTA_TEXT.en, GTA_TEXT[lang], `gta.${lang}`)

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ strings: ${Object.keys(en).length} keys in en, nl and fr · content, health check and GTA layer match the English shape`)
