// A tiny, safe SOQL evaluator for the "SOQL builder" game (no eval, plain JS: it also runs in Node
// for scripts/check-arcade.mjs). It understands
//
//   SELECT f1, f2 FROM Obj [WHERE …] [ORDER BY f [ASC|DESC] [NULLS FIRST|LAST], …] [LIMIT n]
//
// with =, !=, <>, <, >, <=, >=, LIKE ('%x%', '_'), [NOT] IN (…), AND, OR, NOT, parentheses, numbers,
// 'strings', unquoted dates (2026-12-31), true/false/null and parent fields (Account.Name). Like real
// SOQL it is case-insensitive, has no SELECT *, wants parentheses when AND and OR are mixed, and
// checks literal types (no quotes around numbers, dates and booleans).

const KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'AND', 'OR', 'NOT', 'LIKE', 'IN', 'NULLS', 'FIRST', 'LAST'])
const LITERALS = { TRUE: true, FALSE: false, NULL: null }
const DATE = /^\d{4}-\d{2}-\d{2}$/

// Splits text into lexemes { type, value, text, start, end }. Never throws: unknown input becomes 'bad'.
// Types: kw, ident, str, num, date, lit (true/false/null), op, comma, lparen, rparen, star, bad.
export function lex(text) {
  const s = String(text ?? '')
  const out = []
  let i = 0
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue }
    const start = i
    const push = (type, value) => out.push({ type, value, text: s.slice(start, i), start, end: i })
    const rest = s.slice(i)
    let m
    if (s[i] === "'") {
      let v = ''
      let closed = false
      i++
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { v += s[i + 1]; i += 2; continue }
        if (s[i] === "'") { i++; closed = true; break }
        v += s[i++]
      }
      push(closed ? 'str' : 'bad', v)
    } else if ((m = rest.match(/^\d{4}-\d{2}-\d{2}(?![\w-])/))) {
      i += m[0].length
      push('date', m[0])
    } else if ((m = rest.match(/^-?\d+(\.\d+)?(?![\w.])/))) {
      i += m[0].length
      push('num', Number(m[0]))
    } else if ((m = rest.match(/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*/))) {
      i += m[0].length
      const up = m[0].toUpperCase()
      if (up in LITERALS) push('lit', LITERALS[up])
      else if (KEYWORDS.has(up)) push('kw', up)
      else push('ident', m[0])
    } else if ((m = rest.match(/^(<=|>=|!=|<>|=|<|>)/))) {
      i += m[0].length
      push('op', m[0] === '<>' ? '!=' : m[0])
    } else {
      i++
      const single = { ',': 'comma', '(': 'lparen', ')': 'rparen', '*': 'star' }[s[start]]
      push(single ?? 'bad', s[start])
    }
  }
  return out
}

// A comparable key per lexeme, so "order by name" and "ORDER BY Name" count as the same blocks.
const keyOf = (t) => `${t.type}:${['kw', 'ident'].includes(t.type) ? String(t.value).toLowerCase() : String(t.value)}`

class SoqlError extends Error {
  constructor(message, partial) {
    super(message)
    this.partial = partial // true when the query just stops too early (a hint, not a mistake)
  }
}

// Parses a query. Returns { ok: true, query } or { ok: false, error, partial }.
export function parse(text) {
  const toks = lex(text)
  let p = 0
  const peek = (k = 0) => toks[p + k]
  const isKw = (k, t = toks[p]) => t?.type === 'kw' && t.value === k
  const fail = (msg) => { throw new SoqlError(msg, p >= toks.length) }
  const show = (t) => (t.type === 'str' ? t.text : `'${t.text}'`)

  const field = (what = 'a field name') => {
    const t = peek()
    if (!t) fail(`Add ${what}.`)
    if (t.type === 'star') fail('SOQL has no SELECT *: list the fields you need.')
    if (t.type === 'kw') fail(`${t.value} is a keyword: ${what} goes here.`)
    if (t.type !== 'ident') fail(`Expected ${what}, found ${show(t)}.`)
    p++
    return t.value
  }

  const value = () => {
    const t = peek()
    if (!t) fail('Add a value to compare with.')
    p++
    if (t.type === 'str') return { kind: 'str', v: t.value }
    if (t.type === 'num') return { kind: 'num', v: t.value }
    if (t.type === 'date') return { kind: 'date', v: t.value }
    if (t.type === 'lit') return { kind: t.value === null ? 'null' : 'bool', v: t.value }
    p--
    if (t.type === 'ident') fail(`Text values need single quotes: '${t.text}'.`)
    fail(`Expected a value, found ${show(t)}.`)
  }

  const list = () => {
    if (peek()?.type !== 'lparen') fail("IN needs a list in parentheses, like IN ('A', 'B').")
    p++
    const items = [value()]
    while (peek()?.type === 'comma') { p++; items.push(value()) }
    if (peek()?.type !== 'rparen') fail(peek() ? "Separate the values with commas and close the list with ')'." : "Close the list with ')'.")
    p++
    return items
  }

  const cond = () => {
    const t = peek()
    if (!t) fail('Add a condition, like Rating = \'Hot\'.')
    if (t.type !== 'ident') fail(`Expected a field to filter on, found ${show(t)}.`)
    const f = t.value
    p++
    const o = peek()
    if (isKw('NOT') && isKw('IN', peek(1))) { p += 2; return { op: 'NOT IN', field: f, list: list() } }
    if (isKw('IN')) { p++; return { op: 'IN', field: f, list: list() } }
    if (isKw('LIKE')) {
      p++
      const v = value()
      if (v.kind !== 'str') fail("LIKE needs a text pattern in quotes, like '%Brussels%'.")
      return { op: 'LIKE', field: f, value: v }
    }
    if (o?.type === 'op') { p++; return { op: o.value, field: f, value: value() } }
    fail(o ? `After ${f}, add an operator like = or IN, not ${show(o)}.` : `After ${f}, add an operator like = or IN.`)
  }

  let expr
  const unary = () => {
    if (isKw('NOT')) { p++; return { op: 'NOT', part: unary() } }
    if (peek()?.type === 'lparen') {
      p++
      const e = expr()
      if (peek()?.type !== 'rparen') fail(peek() ? `Expected ')', found ${show(peek())}.` : "A '(' is still waiting for its ')'.")
      p++
      return e
    }
    if (peek()?.type === 'rparen') fail("That ')' has no matching '('.")
    return cond()
  }
  expr = () => {
    const parts = [unary()]
    let joiner = null
    while (isKw('AND') || isKw('OR')) {
      const j = peek().value
      if (joiner && j !== joiner) fail('Mixing AND and OR needs parentheses, like A AND (B OR C).')
      joiner = j
      p++
      parts.push(unary())
    }
    return parts.length === 1 ? parts[0] : { op: joiner, parts }
  }

  try {
    if (!toks.length) fail('Start with SELECT.')
    const bad = toks.find((t) => t.type === 'bad')
    if (bad) {
      p = toks.indexOf(bad)
      fail(bad.text.startsWith("'") ? 'A text value is missing its closing quote.' : `SOQL doesn't know ${show(bad)}.`)
    }
    if (!isKw('SELECT')) fail('A query starts with SELECT.')
    p++
    const fields = [field()]
    while (peek()?.type === 'comma') { p++; fields.push(field()) }
    if (peek()?.type === 'ident') fail('Separate the fields with commas.')
    if (!peek()) fail('Now add FROM and the object to query.')
    if (!isKw('FROM')) fail(`Expected FROM, found ${show(peek())}.`)
    p++
    const object = field('the object to query')
    let where = null
    let orderBy = []
    let limit = null
    if (isKw('WHERE')) {
      p++
      where = expr()
    }
    if (isKw('ORDER')) {
      p++
      if (!isKw('BY')) fail('ORDER needs BY: ORDER BY Field.')
      p++
      do {
        if (orderBy.length) p++ // the comma
        const f = field('a field to sort on')
        let dir = 'ASC'
        if (isKw('ASC') || isKw('DESC')) { dir = peek().value; p++ }
        let nulls = dir === 'ASC' ? 'FIRST' : 'LAST'
        if (isKw('NULLS')) {
          p++
          if (!isKw('FIRST') && !isKw('LAST')) fail('NULLS needs FIRST or LAST.')
          nulls = peek().value
          p++
        }
        orderBy.push({ field: f, dir, nulls })
      } while (peek()?.type === 'comma')
    }
    if (isKw('LIMIT')) {
      p++
      const t = peek()
      if (!t) fail('Add a number after LIMIT.')
      if (t.type !== 'num' || !Number.isInteger(t.value) || t.value < 1) fail('LIMIT needs a whole number, like LIMIT 10.')
      p++
      limit = t.value
    }
    if (p < toks.length) {
      const t = peek()
      if (t.type === 'kw' && ['WHERE', 'ORDER', 'LIMIT', 'FROM', 'SELECT'].includes(t.value)) fail('Clauses go in this order: SELECT, FROM, WHERE, ORDER BY, LIMIT. Each one once.')
      if (t.type === 'kw' && ['AND', 'OR'].includes(t.value)) fail(`${t.value} only joins conditions inside WHERE.`)
      fail(`Unexpected ${show(t)}.`)
    }
    return { ok: true, query: { fields, object, where, orderBy, limit } }
  } catch (e) {
    if (e instanceof SoqlError) return { ok: false, error: e.message, partial: e.partial }
    throw e
  }
}

const isPlain = (v) => v != null && typeof v === 'object' && !Array.isArray(v)
const typeOf = (v) => (v == null ? null : typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : DATE.test(v) ? 'date' : 'string')

// Every field path in the data ("Name", "Account.Name") with its type: number, boolean, date, string or
// null (only blanks), plus `mixed: true` when the rows disagree.
export function columnsOf(data) {
  const cols = new Map()
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k
      if (isPlain(v)) { walk(v, path); continue }
      const key = path.toLowerCase()
      const col = cols.get(key) ?? { path, type: null }
      const t = typeOf(v)
      if (t && col.type && col.type !== t) col.mixed = true
      if (t && !col.type) col.type = t
      cols.set(key, col)
    }
  }
  for (const row of data ?? []) if (isPlain(row)) walk(row, '')
  return cols
}

// The value at a field path, walking parent objects; null when any step is blank.
export function get(row, path) {
  let v = row
  for (const part of path.split('.')) {
    if (!isPlain(v)) return null
    const key = Object.keys(v).find((k) => k.toLowerCase() === part.toLowerCase())
    v = key == null ? null : v[key]
  }
  return v ?? null
}

const lower = (v) => (typeof v === 'string' ? v.toLowerCase() : v)
const eq = (a, lit) => (lit.kind === 'null' ? a == null : a != null && lower(a) === lower(lit.v))
const cmp = (a, b) => {
  const x = lower(a)
  const y = lower(b)
  return x < y ? -1 : x > y ? 1 : 0
}
const likeRegex = (pattern) =>
  new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'is')

// Runs a parsed query against { object, data }. Returns { ok, error, fields, rows, sorted }.
// `rows` are whole records (in result order); `sorted` is the full ordered result before LIMIT.
export function run(query, { object, data }) {
  try {
    if (String(query.object).toLowerCase() !== String(object).toLowerCase()) throw new SoqlError(`This round's data is ${object}, not ${query.object}.`)
    const cols = columnsOf(data)
    const col = (f) => {
      const c = cols.get(f.toLowerCase())
      if (!c) throw new SoqlError(`${object} has no field ${f} in this round.`)
      return c
    }
    const fields = query.fields.map((f) => col(f).path)
    const dupe = fields.find((f, i) => fields.indexOf(f) !== i)
    if (dupe) throw new SoqlError(`${dupe} is selected twice.`)

    const checkLit = (c, lit, op) => {
      const f = c.path
      if (lit.kind === 'null') {
        if (!['=', '!=', 'IN', 'NOT IN'].includes(op)) throw new SoqlError('Only = and != work with null.')
        return
      }
      const t = c.type
      if (!t) return
      if (t === 'number' && lit.kind !== 'num') throw new SoqlError(lit.kind === 'str' ? `${f} is a number: drop the quotes.` : `${f} is a number.`)
      if (t === 'string' && lit.kind !== 'str') throw new SoqlError(`${f} is text: put the value in 'single quotes'.`)
      if (t === 'date' && lit.kind !== 'date') throw new SoqlError(lit.kind === 'str' ? `Dates go without quotes in SOQL: ${f} ${op.includes('IN') ? '=' : op} ${DATE.test(lit.v) ? lit.v : '2026-12-31'}.` : `${f} is a date, like 2026-12-31.`)
      if (t === 'boolean' && lit.kind !== 'bool') throw new SoqlError(`${f} is a checkbox: use true or false, without quotes.`)
      if (t === 'boolean' && ['<', '>', '<=', '>='].includes(op)) throw new SoqlError(`${f} is a checkbox: use = true or = false.`)
    }

    const compile = (node) => {
      if (node.op === 'AND' || node.op === 'OR') {
        const parts = node.parts.map(compile)
        return node.op === 'AND' ? (r) => parts.every((fn) => fn(r)) : (r) => parts.some((fn) => fn(r))
      }
      if (node.op === 'NOT') {
        const part = compile(node.part)
        return (r) => !part(r)
      }
      const c = col(node.field)
      const at = (r) => get(r, c.path)
      if (node.op === 'IN' || node.op === 'NOT IN') {
        node.list.forEach((lit) => checkLit(c, lit, node.op))
        const hit = (r) => node.list.some((lit) => eq(at(r), lit))
        return node.op === 'IN' ? hit : (r) => !hit(r)
      }
      checkLit(c, node.value, node.op)
      if (node.op === 'LIKE') {
        if (c.type && c.type !== 'string') throw new SoqlError('LIKE only works on text fields.')
        const re = likeRegex(node.value.v)
        return (r) => at(r) != null && re.test(String(at(r)))
      }
      const lit = node.value
      switch (node.op) {
        case '=': return (r) => eq(at(r), lit)
        case '!=': return (r) => !eq(at(r), lit)
        case '<': return (r) => at(r) != null && cmp(at(r), lit.v) < 0
        case '>': return (r) => at(r) != null && cmp(at(r), lit.v) > 0
        case '<=': return (r) => at(r) != null && cmp(at(r), lit.v) <= 0
        default: return (r) => at(r) != null && cmp(at(r), lit.v) >= 0
      }
    }

    const keep = query.where ? compile(query.where) : () => true
    const order = query.orderBy.map((o) => ({ ...o, path: col(o.field).path }))
    const sorted = (data ?? []).filter(keep)
    if (order.length) {
      sorted.sort((a, b) => {
        for (const o of order) {
          const x = get(a, o.path)
          const y = get(b, o.path)
          if (x == null && y == null) continue
          if (x == null || y == null) return (x == null) === (o.nulls === 'FIRST') ? -1 : 1
          const c = cmp(x, y)
          if (c) return o.dir === 'DESC' ? -c : c
        }
        return 0
      })
    }
    const rows = query.limit ? sorted.slice(0, query.limit) : sorted
    return { ok: true, fields, rows, sorted, order }
  } catch (e) {
    if (e instanceof SoqlError) return { ok: false, error: e.message, partial: false }
    throw e
  }
}

// Parse and run in one go: { ok, error, partial, query, fields, rows, sorted }.
export function runSoql(text, round) {
  const parsed = parse(text)
  if (!parsed.ok) return parsed
  return { ...run(parsed.query, round), query: parsed.query }
}

// How the player's result compares with the expected one.
export function compareResults(expected, actual) {
  const ids = (res) => res.rows.map((r) => r.Id)
  const want = ids(expected)
  const got = actual?.ok ? ids(actual) : []
  const missing = want.filter((id) => !got.includes(id))
  const extra = got.filter((id) => !want.includes(id))
  const rowsOk = !!actual?.ok && !missing.length && !extra.length && got.length === want.length
  const norm = (fs) => [...fs].map((f) => f.toLowerCase()).sort().join(',')
  const fieldsOk = !!actual?.ok && norm(actual.fields) === norm(expected.fields)
  const orderMatters = expected.query.orderBy.length > 0 && want.length > 1
  const orderOk = rowsOk && (!orderMatters || want.every((id, i) => got[i] === id))
  const score = rowsOk ? (fieldsOk && orderOk ? 1 : 0.5) : 0
  return { rowsOk, fieldsOk, orderOk, orderMatters, missing, extra, score }
}

// Finds which tokens (by index, in query order) spell out `answer`, each used at most once; null if none.
export function buildFrom(answer, tokens) {
  const want = lex(answer).map(keyOf)
  const blocks = tokens.map((t) => lex(t).map(keyOf))
  const used = new Set()
  const path = []
  const dfs = (pos) => {
    if (pos === want.length) return true
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      if (used.has(i) || !b.length || b.some((k, j) => want[pos + j] !== k)) continue
      used.add(i)
      path.push(i)
      if (dfs(pos + b.length)) return true
      used.delete(i)
      path.pop()
    }
    return false
  }
  return dfs(0) ? path : null
}

// What kind of block a token is, for colouring: clause, logic, paren or expr.
export function blockKind(token) {
  const first = lex(token)[0]
  if (!first) return 'expr'
  if (first.type === 'kw' && ['SELECT', 'FROM', 'WHERE', 'ORDER', 'LIMIT'].includes(first.value)) return 'clause'
  if (first.type === 'kw' && ['AND', 'OR', 'NOT'].includes(first.value)) return 'logic'
  if (first.type === 'lparen' || first.type === 'rparen') return 'paren'
  return 'expr'
}

// A cell value as text: 1,250,000 · true · 2026-12-31 · null stays null (shown as a dash).
export function formatValue(v) {
  if (v == null) return null
  if (typeof v === 'number') return v.toLocaleString('en-US')
  return String(v)
}
