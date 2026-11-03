// Service Desk Shift: a small support-desk simulation with no React in it, so it can move to
// another site later. One game second is ten minutes; a shift runs from 09:00 to 17:00.

export const SHIFT = 48 // game seconds
export const HOUR = 6 // game seconds per hour

export const SKILLS = {
  billing: { icon: '💳', label: 'Billing' },
  tech: { icon: '🛠️', label: 'Tech' },
  vip: { icon: '⭐', label: 'VIP' },
  general: { icon: '💬', label: 'General' },
}

export const AGENTS = [
  { id: 'ana', name: 'Ana', skill: 'billing' },
  { id: 'tom', name: 'Tom', skill: 'tech' },
  { id: 'lea', name: 'Lea', skill: 'vip' },
  { id: 'sam', name: 'Sam', skill: 'general' },
]

// The four switches of the setup round. `tip` is shown on the results when the switch was left off.
export const TOGGLES = [
  {
    id: 'routing', icon: '🧭', name: 'Skills routing', feature: 'Omni-Channel',
    on: 'Each case is pushed to a free agent with the right skill, instantly.',
    off: 'Agents pick cases from a list view, oldest first. You can tap to assign.',
    tip: 'Turn on skills routing: cases reach the right agent instantly instead of whoever grabs them.',
  },
  {
    id: 'sla', icon: '⏱️', name: 'Entitlements', feature: 'Entitlements and milestones',
    on: 'VIPs get a 1-hour response time, others 4 hours. The queue sorts by deadline.',
    off: 'No SLA clock: nobody sees which case is about to breach.',
    tip: 'Turn on entitlements: with a milestone on every case, the most urgent one is handled first.',
  },
  {
    id: 'escalation', icon: '🚨', name: 'Escalation', feature: 'Escalation rules',
    on: 'A case close to its deadline jumps the queue and goes to the first free agent.',
    off: 'Late cases wait their turn like any other.',
    tip: 'Turn on escalation: a case about to breach goes to the first free agent, whatever their skill.',
  },
  {
    id: 'macros', icon: '📚', name: 'Macros + Knowledge', feature: 'Macros and Knowledge',
    on: 'One-click replies and suggested articles cut handling time by 40%.',
    off: 'Every answer is looked up and typed from scratch.',
    tip: 'Turn on macros and Knowledge: agents close cases 40% faster, so the queue never piles up.',
  },
]

const PATIENCE = { vip: 1 * HOUR, billing: 4 * HOUR, tech: 4 * HOUR, general: 4 * HOUR } // first response
const WORK = { general: 0.5 * HOUR, billing: 0.75 * HOUR, tech: 1.2 * HOUR, vip: 0.8 * HOUR }
const WRONG_SKILL = 1.8 // an agent outside their skill is this much slower
const MACROS = 0.6
const ESCALATE_AT = 0.6 // share of the deadline after which a waiting case is escalated
const PICK_DELAY = 1.5 // without routing, an idle agent needs this long to pick from the list view
const LAST_ARRIVAL = SHIFT - 6

const SUBJECTS = {
  billing: ['Invoice charged twice', 'Refund still missing', 'Wrong VAT on invoice', 'Card declined at renewal', 'Credit note request', 'Upgrade billed twice'],
  tech: ['API sync failing', 'Flow error on save', 'Report times out', 'SSO login loop', 'Import stuck at 80%', 'Webhook not firing'],
  vip: ['Portal down for our team', 'Contract renewal question', 'Urgent: data export', 'Exec dashboard is empty', 'Go-live tomorrow, help'],
  general: ['Change my address', 'Where is my order?', 'Reset my password', 'Add a new user', 'Cancel a meeting', 'Update contact details', 'Opening hours?'],
}

// Small seeded random generator, so every shift brings the same Monday.
function random(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function script(seed) {
  const rnd = random(seed)
  const mix = ['general', 'billing', 'tech', 'general', 'vip', 'billing', 'tech', 'general', 'vip']
  const used = { billing: 0, tech: 0, vip: 0, general: 0 }
  const cases = []
  let t = 0.4
  while (t < LAST_ARRIVAL) {
    const skill = mix[Math.floor(rnd() * mix.length)]
    const list = SUBJECTS[skill]
    cases.push({ id: cases.length + 1, skill, subject: list[used[skill]++ % list.length], arrive: t })
    // The Monday-morning rush: cases come in faster in the first two hours.
    t += t < 2 * HOUR ? 0.35 + rnd() * 0.45 : 0.75 + rnd() * 0.85
  }
  return cases
}

export class Shift {
  constructor(setup, seed = 7) {
    this.setup = setup
    this.t = 0
    this.incoming = script(seed)
    this.cases = []
    this.agents = AGENTS.map((a) => ({ ...a, case: null, idleSince: 0, last: null }))
  }

  get done() {
    return this.t >= SHIFT
  }

  // Waiting cases in the order the desk sees them: escalated first, then by deadline (with
  // entitlements) or by arrival (without).
  get queue() {
    const waiting = this.cases.filter((c) => c.startAt == null)
    const due = (c) => (this.setup.sla ? c.arrive + PATIENCE[c.skill] : c.arrive)
    return waiting.sort((a, b) => (b.escalated ? 1 : 0) - (a.escalated ? 1 : 0) || due(a) - due(b))
  }

  // How far a waiting case is into its response time, 0–1.
  pressure(c) {
    return Math.min(1, (this.t - c.arrive) / PATIENCE[c.skill])
  }

  start(c, agent) {
    const wrong = c.skill !== 'general' && agent.skill !== c.skill
    c.startAt = this.t
    c.agent = agent.id
    c.wrong = wrong
    c.work = WORK[c.skill] * (wrong ? WRONG_SKILL : 1) * (this.setup.macros ? MACROS : 1)
    agent.case = c
  }

  // Manual assignment by the player (only used without skills routing).
  assign(caseId, agentId) {
    const c = this.cases.find((x) => x.id === caseId && x.startAt == null)
    const agent = this.agents.find((a) => a.id === agentId && !a.case)
    if (c && agent && !this.done) this.start(c, agent)
    return Boolean(c && agent)
  }

  tick(dt) {
    if (this.done) return
    this.t = Math.min(SHIFT, this.t + dt)
    const { t, setup } = this

    while (this.incoming.length && this.incoming[0].arrive <= t) this.cases.push(this.incoming.shift())

    for (const agent of this.agents) {
      const c = agent.case
      if (!c || t - c.startAt < c.work) continue
      c.doneAt = t
      c.stars = Math.max(1, Math.min(5, (c.breached ? 2 : 5) - (c.wrong ? 1 : 0) - (setup.macros ? 0 : 0.5)))
      agent.case = null
      agent.idleSince = t
      agent.last = { stars: c.stars, at: t }
    }

    for (const c of this.cases) {
      if (c.startAt != null) continue
      const waited = t - c.arrive
      if (!c.breached && waited > PATIENCE[c.skill]) Object.assign(c, { breached: true, breachedAt: t })
      if (setup.escalation && !c.escalated && waited > PATIENCE[c.skill] * ESCALATE_AT) c.escalated = true
    }

    const free = () => this.agents.filter((a) => !a.case)
    if (setup.routing) {
      for (const c of this.queue) {
        const idle = free()
        const match =
          c.skill === 'general'
            ? idle.find((a) => a.skill === 'general') || idle[0]
            : idle.find((a) => a.skill === c.skill) || (c.escalated ? idle[0] : null)
        if (match) this.start(c, match)
      }
    } else {
      for (const agent of free()) {
        if (t - agent.idleSince < PICK_DELAY) continue
        const next = this.queue[0]
        if (next) this.start(next, agent)
      }
    }
  }

  summary() {
    const arrived = this.cases.length
    const breached = this.cases.filter((c) => c.breached).length
    const solved = this.cases.filter((c) => c.doneAt != null)
    const avg = (list, f) => (list.length ? list.reduce((s, c) => s + f(c), 0) / list.length : 0)
    return {
      arrived,
      breached,
      handled: solved.length,
      sla: arrived ? Math.round(((arrived - breached) / arrived) * 100) : 100,
      csat: Math.round(avg(solved, (c) => c.stars) * 10) / 10,
      resolve: avg(solved, (c) => c.doneAt - c.arrive) / HOUR, // hours
    }
  }
}

// The same Monday with no automation at all and nobody helping: the comparison on the results.
export function baseline(seed = 7) {
  const shift = new Shift({ routing: false, sla: false, escalation: false, macros: false }, seed)
  while (!shift.done) shift.tick(0.1)
  return shift.summary()
}

// "09:40" for a game time.
export function clockAt(t) {
  const minutes = Math.round((t / HOUR) * 60) + 9 * 60
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// "1h 25m" for a duration in hours.
export function duration(hours) {
  const m = Math.round(hours * 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}
