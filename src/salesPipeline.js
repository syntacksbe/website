// Pipeline Quarter: a small sales-team simulation with no React in it, so it can move to another
// site later. Two game seconds are one week; a quarter is 13 weeks. Amounts are in € thousands.

export const QUARTER = 26 // game seconds
export const WEEK = 2 // game seconds per week
export const QUOTA = 850 // €k

export const REPS = [
  { id: 'nina', name: 'Nina' },
  { id: 'omar', name: 'Omar' },
  { id: 'jules', name: 'Jules' },
]

export const HEAT = {
  hot: { icon: '🔥', label: 'Hot', score: [82, 98] },
  warm: { icon: '🌤️', label: 'Warm', score: [48, 74] },
  cold: { icon: '🧊', label: 'Cold', score: [6, 30] },
}

// The four switches. They can be flipped before and during the quarter; `tip` shows on the
// results when the switch ended the quarter off.
export const TOGGLES = [
  {
    id: 'assign', icon: '🎯', name: 'Lead assignment', feature: 'Assignment rules',
    on: 'Every new lead goes to a free rep the moment it arrives.',
    off: 'Leads sit in a shared queue until a rep notices them. Tap one to hand it out.',
    tip: 'Turn on lead assignment: a lead answered in minutes is far more likely to buy than one answered next week.',
  },
  {
    id: 'scoring', icon: '🔥', name: 'Lead scoring', feature: 'Einstein Lead Scoring',
    on: 'Hot leads first. Cold ones go to a marketing nurture instead of a rep.',
    off: 'Reps call leads in order and lose hours on ones that will never buy.',
    tip: 'Turn on lead scoring: your reps stop spending their week on leads that will never buy.',
  },
  {
    id: 'cadence', icon: '📨', name: 'Follow-up cadences', feature: 'Sales Engagement',
    on: 'Automatic follow-ups keep buyers warm while they wait for a quote.',
    off: 'Buyers waiting for a quote cool off fast and sign elsewhere.',
    tip: 'Turn on follow-up cadences: buyers waiting for a quote stay warm instead of signing with a competitor.',
  },
  {
    id: 'cpq', icon: '🧾', name: 'Quote templates', feature: 'Quotes and CPQ',
    on: 'Quotes come out of the price book in minutes.',
    off: 'Every quote is built by hand in a spreadsheet.',
    tip: 'Turn on quote templates: a quote in minutes instead of days frees your reps for the next deal.',
  },
]

const QUALIFY = 0.9 // a rep's first call
const QUOTE = { manual: 1.6, cpq: 0.45 }
const NEGOTIATE = 2.2 // the buyer decides; no rep time needed
const LEAD_STALE = 2.4 // a new lead waiting longer than this buys elsewhere
const OPP_STALE = { manual: 2.6, cadence: 5.2 } // a buyer waiting for a quote
const WIN = { hot: 0.8, warm: 0.45 }
const CADENCE_BONUS = 0.1
const PICK_DELAY = 0.7 // without assignment rules, an idle rep needs this long to spot the next lead
const LAST_ARRIVAL = QUARTER - 7

const COMPANIES = [
  'Polder Labs', 'Bluequay Logistics', 'Meuse Robotics', 'Northgate Foods', 'Sablon Interiors', 'Ardenne Outdoor',
  'Canal Street Media', 'Brickworks Studio', 'Dune Energy', 'Harbour Health', 'Lime & Lace', 'Velo Fleet',
  'Kantoor Plus', 'Greenfield Farms', 'Tidal Insurance', 'Quarry Tools', 'Pixel Bakery', 'Signal Telecom',
  'Atlas Freight', 'Orchard Retail', 'Copper Kettle', 'Mosaic Clinics', 'Beacon Schools', 'Fjord Software',
  'Hops & Barley', 'Linden Legal', 'Nova Pharma', 'Riverbend Hotels', 'Slate Construction', 'Sunbeam Solar',
  'Willow Care', 'Zinc Mobility', 'Ember Coffee', 'Granite Bank', 'Lumen Lighting', 'Maple Logistics',
]

function random(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The same quarter every time: leads with a hidden temperature, a size and a fixed dose of luck.
function script(seed) {
  const rnd = random(seed)
  const leads = []
  let t = 0.3
  while (t < LAST_ARRIVAL) {
    const r = rnd()
    const heat = r < 0.3 ? 'hot' : r < 0.68 ? 'warm' : 'cold'
    const [lo, hi] = HEAT[heat].score
    leads.push({
      id: leads.length + 1,
      company: COMPANIES[leads.length % COMPANIES.length],
      heat,
      score: Math.round(lo + rnd() * (hi - lo)),
      value: Math.round((heat === 'hot' ? 30 : 15) + rnd() * 35),
      luck: rnd(),
      arrive: t,
    })
    t += 0.3 + rnd() * 0.3
  }
  // One whale, mid-quarter.
  const whale = leads[Math.floor(leads.length / 2)]
  Object.assign(whale, { company: 'Royal Delta Group', heat: 'hot', score: 97, value: 140, luck: 0.3, whale: true })
  return leads
}

export class Quarter {
  constructor(setup, seed = 11) {
    this.setup = setup
    this.t = 0
    this.incoming = script(seed)
    this.deals = [] // every lead that arrived, with a `stage`
    this.reps = REPS.map((r) => ({ ...r, task: null, idleSince: 0 }))
  }

  get done() {
    return this.t >= QUARTER
  }

  // Work waiting for a rep: new leads to call and opportunities that need a quote.
  get todo() {
    const waiting = this.deals.filter((d) => (d.stage === 'lead' || d.stage === 'proposal') && !d.rep)
    const rank = (d) => {
      if (!this.setup.scoring) return 0
      if (d.stage === 'lead') return d.heat === 'hot' ? 0 : d.heat === 'warm' ? 2 : 3
      return 1 // quotes come right after hot leads
    }
    return waiting.sort((a, b) => rank(a) - rank(b) || a.since - b.since)
  }

  // How far a waiting lead or opportunity is towards going to a competitor, 0–1.
  pressure(d) {
    const limit = d.stage === 'lead' ? LEAD_STALE : this.setup.cadence ? OPP_STALE.cadence : OPP_STALE.manual
    return Math.min(1, (this.t - d.since) / limit)
  }

  start(d, rep) {
    d.rep = rep.id
    d.workStart = this.t
    d.work = d.stage === 'lead' ? QUALIFY : this.setup.cpq ? QUOTE.cpq : QUOTE.manual
    rep.task = d
  }

  // The player hands a waiting card to the first free rep (only without assignment rules).
  claim(dealId) {
    const d = this.todo.find((x) => x.id === dealId)
    const rep = this.reps.find((r) => !r.task)
    if (!d || !rep || this.done) return false
    this.start(d, rep)
    return true
  }

  close(d, stage, reason) {
    Object.assign(d, { stage, reason, closedAt: this.t, rep: null })
  }

  tick(dt) {
    if (this.done) return
    this.t = Math.min(QUARTER, this.t + dt)
    const { t, setup } = this

    while (this.incoming.length && this.incoming[0].arrive <= t) {
      const lead = this.incoming.shift()
      this.deals.push({ ...lead, stage: 'lead', since: t })
    }

    // Finished calls and quotes.
    for (const rep of this.reps) {
      const d = rep.task
      if (!d || t - d.workStart < d.work) continue
      rep.task = null
      rep.idleSince = t
      d.rep = null
      if (d.stage === 'lead') {
        if (d.heat === 'cold') this.close(d, 'lost', 'Not a fit')
        else Object.assign(d, { stage: 'proposal', since: t })
      } else {
        Object.assign(d, { stage: 'negotiation', since: t, chance: WIN[d.heat] + (setup.cadence ? CADENCE_BONUS : 0) })
      }
    }

    for (const d of this.deals) {
      if (d.stage === 'negotiation' && t - d.since >= NEGOTIATE) {
        if (d.luck < d.chance) this.close(d, 'won', 'Closed won')
        else this.close(d, 'lost', 'Said no')
      } else if ((d.stage === 'lead' || d.stage === 'proposal') && !d.rep) {
        if (setup.scoring && d.stage === 'lead' && d.heat === 'cold') this.close(d, 'nurture', 'To nurture')
        else if (this.pressure(d) >= 1) this.close(d, 'lost', 'Went to a competitor')
      }
    }

    for (const rep of this.reps.filter((r) => !r.task)) {
      if (!setup.assign && t - rep.idleSince < PICK_DELAY) continue
      const next = this.todo[0]
      if (next) this.start(next, rep)
    }
  }

  summary() {
    const won = this.deals.filter((d) => d.stage === 'won')
    const booked = won.reduce((s, d) => s + d.value, 0)
    return {
      leads: this.deals.length,
      won: won.length,
      booked,
      quota: Math.round((booked / QUOTA) * 100),
      lostToCompetitors: this.deals.filter((d) => d.reason === 'Went to a competitor').length,
      whale: won.some((d) => d.whale),
      open: this.deals.filter((d) => d.stage === 'proposal' || d.stage === 'negotiation').length,
    }
  }
}

// The same quarter with no automation and nobody helping: the comparison on the results.
export function baseline(seed = 11) {
  const q = new Quarter({ assign: false, scoring: false, cadence: false, cpq: false }, seed)
  while (!q.done) q.tick(0.1)
  return q.summary()
}

export const weekAt = (t) => Math.min(13, Math.floor(t / WEEK) + 1)
export const euros = (k) => (k >= 1000 ? `€${(k / 1000).toFixed(2)}M` : `€${k}k`)
