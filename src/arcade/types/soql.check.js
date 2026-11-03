// "SOQL builder": build a query from token blocks, see the rows it returns, run it.
// Round: { q, object, data: [{ Id, … }] (5–10 rows), tokens: [blocks incl. 2–4 decoys], answer, why }.
// The player's query is right when it returns the same records, fields and (with ORDER BY) order.
import { buildFrom, columnsOf, get, lex, runSoql } from './soql.engine.js'

const str = (v) => typeof v === 'string' && v.trim().length > 0
const isPlain = (v) => v != null && typeof v === 'object' && !Array.isArray(v)
const okValue = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v) || (isPlain(v) && Object.values(v).every(okValue))

export default {
  label: 'SOQL builder',
  icon: '🔎',
  rounds: [3, 6],
  checkRound(r) {
    const e = []
    if (!str(r.q)) e.push('missing q')
    if (!str(r.object) || !/^[A-Za-z]\w*$/.test(r.object)) e.push('object must be an sObject name')
    if (!Array.isArray(r.data) || r.data.length < 5 || r.data.length > 10) e.push('data needs 5–10 rows')
    else if (!r.data.every(isPlain)) e.push('data rows must be objects')
    else {
      const ids = r.data.map((row) => row.Id)
      if (!ids.every(str)) e.push('every data row needs a string Id')
      else if (new Set(ids).size !== ids.length) e.push('data Ids must be unique')
      if (!r.data.every((row) => Object.values(row).every(okValue))) e.push('data values must be text, numbers, booleans, null or parent objects')
      for (const c of columnsOf(r.data).values()) if (c.mixed) e.push(`column ${c.path} mixes value types`)
    }
    if (!Array.isArray(r.tokens) || r.tokens.length < 4 || r.tokens.length > 16 || !r.tokens.every(str)) e.push('needs 4–16 token strings')
    else {
      if (new Set(r.tokens.map((t) => t.trim())).size !== r.tokens.length) e.push('tokens must be unique')
      for (const t of r.tokens) if (lex(t).some((x) => x.type === 'bad')) e.push(`token has a typo SOQL can't read: ${t}`)
    }
    if (!str(r.answer)) e.push('missing answer')
    if (e.length) return e

    const res = runSoql(r.answer, r)
    if (!res.ok) return [...e, `answer does not run: ${res.error}`]
    if (!res.rows.length) e.push('answer returns no rows')
    const { orderBy, limit } = res.query
    if (limit && !orderBy.length) e.push('answer uses LIMIT without ORDER BY, so its rows are not well defined')
    if (orderBy.length) {
      // Ties make the order (and the rows LIMIT keeps) depend on the data order: not fair to the player.
      const key = (row) => JSON.stringify(res.order.map((o) => {
        const v = get(row, o.path)
        return typeof v === 'string' ? v.toLowerCase() : v
      }))
      const upto = Math.min(res.sorted.length - 1, limit ?? res.sorted.length)
      for (let i = 1; i <= upto; i++) if (key(res.sorted[i]) === key(res.sorted[i - 1])) { e.push('answer ORDER BY has ties, so the order is ambiguous'); break }
    }
    const cover = buildFrom(r.answer, r.tokens)
    if (!cover) e.push('answer cannot be built from the tokens')
    else {
      const decoys = r.tokens.length - cover.length
      if (decoys < 2 || decoys > 4) e.push(`needs 2–4 decoy tokens (has ${decoys})`)
    }
    return e
  },
}
