// "Price is right": guess the net price of a quote line from its pricing steps.
//
// Round: { q, product, qty, listPrice, currency: 'EUR', target: 'net-total' | 'net-unit', steps, why }
// Steps apply in order to the unit price, each rounded to cents:
//   { label, kind: 'percent', value }    value % off the running price
//   { label, kind: 'amount', value }     value € off per unit
//   { label, kind: 'override', value }   new unit price; with `block: true` it is the price of the whole
//                                         line (CPQ block pricing: the quantity no longer multiplies it)
//   { label, kind: 'schedule', type: 'range' | 'slab', tiers: [{ from, pct }, …] }
//                                         a CPQ discount schedule: range = every unit gets the tier the
//                                         quantity falls in; slab = each tier's units get that tier's %
// Optional `stage` names the CPQ price the step produces, so the reveal follows the CPQ waterfall:
//   list (block price) → special (contracted) → regular (discount schedule) → customer (additional
//   discount) → partner (partner discount) → net (distributor discount). CPQ games must stage every step.
// Net total = net unit × quantity (× 1 after a block price).

export const STAGES = {
  list: 'List price',
  special: 'Special price',
  regular: 'Regular price',
  customer: 'Customer price',
  partner: 'Partner price',
  net: 'Net price',
}
const STAGE_ORDER = Object.keys(STAGES)

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

// "1,234.5" → "1,234.50"; integers stay bare ("1,234") unless `cents` is set.
export function number(n, cents = !Number.isInteger(round2(n))) {
  const [int, dec] = Math.abs(round2(n)).toFixed(2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${n < 0 ? '−' : ''}${grouped}${cents ? `.${dec}` : ''}`
}
export const money = (n, cents) => `€${number(n, cents)}`

// Tiers as people read them: "1–100", "101–200", "201+".
export const tierLabel = (tiers, i) => (i + 1 < tiers.length ? `${tiers[i].from}–${tiers[i + 1].from - 1}` : `${tiers[i].from}+`)

// The discount a schedule gives this quantity, plus a short explanation.
export function scheduleDiscount(step, qty) {
  const tiers = step.tiers
  if (step.type === 'range') {
    let i = 0
    tiers.forEach((t, k) => { if (qty >= t.from) i = k })
    return { pct: tiers[i].pct, detail: `${qty} units sit in the ${tierLabel(tiers, i)} tier → ${tiers[i].pct}% on all of them` }
  }
  let off = 0
  const parts = []
  tiers.forEach((t, k) => {
    const end = k + 1 < tiers.length ? tiers[k + 1].from - 1 : Infinity
    const units = Math.max(0, Math.min(qty, end) - t.from + 1)
    if (!units) return
    off += units * t.pct
    parts.push(`${units} at ${t.pct}%`)
  })
  const pct = off / qty
  return { pct, detail: `${parts.join(' + ')} → blended ${Math.round(pct * 100) / 100}%` }
}

// Runs the steps. Returns every stage in the round's target unit (per unit or line total) and the net.
export function priceLine(round) {
  const { qty, listPrice, target } = round
  let unit = round2(listPrice)
  let mult = qty
  const value = () => round2(target === 'net-unit' ? unit : unit * mult)
  const list = value()
  const stages = (round.steps ?? []).map((step) => {
    const before = value()
    let detail = ''
    if (step.kind === 'percent') unit = round2(unit * (1 - step.value / 100))
    if (step.kind === 'amount') unit = round2(unit - step.value)
    if (step.kind === 'override') {
      unit = round2(step.value)
      if (step.block) {
        mult = 1
        detail = `${qty} units, one block price`
      }
    }
    if (step.kind === 'schedule') {
      const s = scheduleDiscount(step, qty)
      unit = round2(unit * (1 - s.pct / 100))
      detail = s.detail
    }
    return { step, before, after: value(), unit, detail }
  })
  return { list, stages, unit, total: round2(unit * mult), net: value() }
}

// Score a guess: within 2% → 1, 5% → 0.75, 10% → 0.5, else 0.
export function scoreGuess(guess, net) {
  const off = Math.abs(guess - net) / net
  return off <= 0.02 ? 1 : off <= 0.05 ? 0.75 : off <= 0.1 ? 0.5 : 0
}

const str = (v) => typeof v === 'string' && v.trim().length > 0
const num = (v) => typeof v === 'number' && Number.isFinite(v)

function checkRound(r, game) {
  const errors = []
  if (!str(r.q)) errors.push('missing q')
  if (!str(r.product)) errors.push('missing product')
  if (!Number.isInteger(r.qty) || r.qty < 1) errors.push('qty must be a positive integer')
  if (!num(r.listPrice) || r.listPrice <= 0) errors.push('listPrice must be a positive number')
  if (r.currency !== 'EUR') errors.push("currency must be 'EUR'")
  if (!['net-total', 'net-unit'].includes(r.target)) errors.push("target must be 'net-total' or 'net-unit'")
  if (!Array.isArray(r.steps) || r.steps.length < 1 || r.steps.length > 6) return [...errors, 'needs 1–6 steps']
  if (errors.length) return errors

  let lastStage = -1
  let blocked = false
  r.steps.forEach((s, i) => {
    const at = `step ${i + 1}`
    if (!str(s?.label)) errors.push(`${at}: missing label`)
    if (!['percent', 'amount', 'override', 'schedule'].includes(s?.kind)) return errors.push(`${at}: unknown kind ${s?.kind}`)
    if (s.kind === 'schedule') {
      if (!['range', 'slab'].includes(s.type)) errors.push(`${at}: schedule type must be range or slab`)
      const ok = Array.isArray(s.tiers) && s.tiers.length >= 2 && s.tiers[0]?.from === 1 &&
        s.tiers.every((t, k) => Number.isInteger(t?.from) && num(t.pct) && t.pct >= 0 && t.pct < 100 && (k === 0 || t.from > s.tiers[k - 1].from))
      if (!ok) errors.push(`${at}: tiers must be 2+ { from, pct } starting at 1, ascending`)
    } else {
      if (!num(s.value) || s.value <= 0) errors.push(`${at}: value must be a positive number`)
      else if (s.kind === 'percent' && s.value >= 100) errors.push(`${at}: percent must be below 100`)
      else if (str(s.label)) {
        const shown = s.kind === 'percent' ? `${s.value}%` : number(s.value)
        if (!s.label.includes(shown)) errors.push(`${at}: label should show ${shown}`)
      }
    }
    if (s.block && s.kind !== 'override') errors.push(`${at}: only an override can be a block price`)
    if (s.block && r.target !== 'net-total') errors.push(`${at}: a block price needs target net-total`)
    if (blocked && s.kind === 'amount') errors.push(`${at}: a per-unit amount can't follow a block price`)
    if (s.block) blocked = true
    if (s.stage != null) {
      const k = STAGE_ORDER.indexOf(s.stage)
      if (k < 0) errors.push(`${at}: unknown stage ${s.stage}`)
      else if (k < lastStage) errors.push(`${at}: stage ${s.stage} comes too late (CPQ waterfall order: ${STAGE_ORDER.join(' → ')})`)
      else lastStage = k
    } else if (game?.category === 'cpq') errors.push(`${at}: CPQ steps need a stage`)
  })
  if (errors.length) return errors

  const { stages, net } = priceLine(r)
  if (stages.some((s) => s.unit <= 0) || net <= 0) errors.push('the price drops to zero or below')
  else if (str(r.why) && !r.why.includes(number(net)) && !r.why.includes(number(net, true))) errors.push(`why should state the net (${money(net)})`)
  return errors
}

export default { label: 'Price is right', icon: '🧮', rounds: [3, 6], checkRound }
