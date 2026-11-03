// The looping mini-scenes of the services loadout, one per service id in content.js.
// Each scene is drawn from `t`, the seconds since the loop started (0 → LOOP), which Services.jsx ticks;
// CSS transitions do the moving. With reduced motion Services.jsx passes FINAL, so every scene shows its end state.
// Positions are percentages of the 16:9 screen, sizes in cqw (the screen is a container).
// Labels and prose come from strings.<lang>.js (sc.*); code, log lines and record data stay English.
import { useLang } from '../i18n.jsx'

export const LOOP = 7
export const FINAL = 6.4

const lerp = (t, a, b, from, to) => (t <= a ? from : t >= b ? to : from + ((to - from) * (t - a)) / (b - a))
const at = (x, y, extra) => ({ left: `${x}%`, top: `${y}%`, ...extra })
const cx = (...names) => names.filter(Boolean).join(' ')

function Stamp({ on, className, children }) {
  return <p className={cx('sc-stamp', on && 'on', className)}>{children}</p>
}

/* 01 · Custom development: a query in a loop blows the limit, a refactor fixes it. */
const BAD = [
  ['trigger AccountTrigger on Account'],
  ['    (after update) {'],
  ['  for (Account a : Trigger.new) {'],
  ['    Contact[] cs = [', true],
  ['      SELECT Id FROM Contact', true],
  ['      WHERE AccountId = :a.Id];', true],
  ['  }'],
  ['}'],
]
const GOOD = [
  ['trigger AccountTrigger on Account'],
  ['    (after update) {'],
  ['  new AccountHandler()'],
  ['    .syncContacts(Trigger.newMap);'],
  ['}'],
  ['// handler: one query, every record', 'c'],
  ['[SELECT Id, AccountId FROM Contact', 'q'],
  [' WHERE AccountId IN :accountIds]', 'q'],
]

function Bulkify({ t }) {
  const { t: tr } = useLang()
  const count = Math.round(t < 3 ? lerp(t, 0.4, 3, 0, 101) : lerp(t, 3.9, 4.4, 101, 1))
  const fixed = t >= 4
  const glitch = t >= 3 && t < 3.8
  const tone = fixed ? 'ok' : count >= 101 ? 'bad' : count > 60 ? 'warn' : 'idle'
  return (
    <div className={cx('sc', glitch && 'glitch')}>
      <div className="sc-panel s1-editor">
        <div className="s1-tab"><i /><i /><i /> AccountTrigger.trigger</div>
        <pre className={cx('s1-code', fixed && 'gone')}>
          {BAD.map(([line, hot], i) => <span key={i} className={cx(hot && t >= 1 && 'hot')}>{line}</span>)}
        </pre>
        <pre className={cx('s1-code', !fixed && 'gone')}>
          {GOOD.map(([line, kind], i) => <span key={i} className={kind}>{line}</span>)}
        </pre>
        <span className={cx('s1-scan', t >= 3.7 && t < 4.4 && 'run')} />
      </div>
      <div className="s1-side">
        <span className="sc-chip">{tr('sc.records200')}</span>
        <span className="sc-label">{tr('sc.soql')}</span>
        <p className={cx('s1-count', tone)}>{count}<small>/ 100</small></p>
        <div className={cx('sc-meter', tone)}><b style={{ width: `${Math.min(count, 100)}%` }} /></div>
      </div>
      <p className={cx('s1-error', glitch && 'on')}>System.LimitException: Too many SOQL queries: 101</p>
      <Stamp on={t >= 5.1} className="s1-stamp">{tr('sc.bulkSafe')}</Stamp>
    </div>
  )
}

/* 02 · Integrations: orders travel to the ERP; one hits a 503, waits in the retry queue and still arrives. */
function PacketRun({ t }) {
  const { t: tr } = useLang()
  const down = t >= 2 && t < 4.1
  const p1 = { x: t < 0.4 ? 27 : 73, y: 42, c: 'g', d: '1.2s', on: t >= 0.3 && t < 1.7 }
  const p2 =
    t < 2.1 ? { x: 27, y: 42, c: 'g', d: '.8s' }
    : t < 2.9 ? { x: 70, y: 42, c: 'g', d: '.8s' }
    : t < 3.1 ? { x: 70, y: 42, c: 'r', d: '.6s' }
    : t < 4.3 ? { x: 50, y: 83, c: 'r', d: '.6s' }
    : t < 4.8 ? { x: 50, y: 42, c: 'g', d: '.4s' }
    : { x: 73, y: 42, c: 't', d: '.8s' }
  p2.on = t >= 2 && t < 5.6
  const p3 = { x: t < 4.7 ? 27 : 73, y: 42, c: 'g', d: '1.1s', on: t >= 4.6 && t < 5.8 }
  const synced = (t >= 1.6) + (t >= 5.6) + (t >= 5.8)
  const queue = t < 3.3 ? 'empty' : t < 3.8 ? 'retry 1 · wait 2s' : t < 4.3 ? 'retry 2 · wait 4s' : 'delivered ✓'

  const packet = (p, label, extra) => (
    <span className={cx('s2-pk mv', p.c, !p.on && 'off')} style={at(p.x, p.y, { '--d': p.d })}>
      {label}
      {extra}
    </span>
  )
  return (
    <div className="sc">
      <div className="sc-panel s2-node s2-sf">
        <svg viewBox="0 0 64 40" aria-hidden="true"><path d="M18 36a12 12 0 0 1-1-24 15 15 0 0 1 28-2 11 11 0 0 1 3 22z" /></svg>
        <strong>Salesforce</strong>
        <small>Order__c</small>
      </div>
      <div className={cx('sc-panel s2-node s2-erp', down && 'down')}>
        <div className="s2-rack"><i /><i /><i /></div>
        <strong>ERP</strong>
        <small>{tr('sc.synced', synced)}</small>
        <em className="s2-503">503</em>
      </div>
      <span className="s2-wire" />
      <p className="s2-lock">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2M3 7h10v8H3z" /></svg>
        Named Credential
      </p>
      <div className={cx('sc-panel s2-queue', t >= 3.1 && t < 4.3 && 'busy')}>
        <span className="sc-label">{tr('sc.retryQueue')}</span>
        <p className="mono">{queue}</p>
      </div>
      {packet(p1, '#101')}
      {packet(p2, '#102', <em className={cx(t >= 2.9 && t < 4.3 && 'on')}>503</em>)}
      {packet(p3, '#103')}
      <Stamp on={t >= 6} className="s2-stamp">{tr('sc.zeroLost')}</Stamp>
    </div>
  )
}

/* 03 · Data: legacy CSV rows drop into a funnel and come out as related records; the duplicate gets merged. */
const ROWS = [
  { text: 'ACME NV;BE;Gold', out: 'acc', label: 'Acme NV' },
  { text: 'acme nv ;be;gold', dup: true },
  { text: 'Peeters, Jan;ACME', out: 'con', label: 'Jan Peeters' },
  { text: 'GLOBEX BV;NL;;', out: 'acc', label: 'Globex BV' },
  { text: 'OPP-2291;€12k;ACME', out: 'opp', label: 'OPP-2291' },
]
const OBJECTS = { acc: { name: 'Account', x: 72, y: 24 }, con: { name: 'Contact', x: 63, y: 72 }, opp: { name: 'Opportunity', x: 86, y: 72 } }

function Shredder({ t }) {
  const { t: tr } = useLang()
  const start = (i) => 0.5 + 0.65 * i
  const counts = { acc: 0, con: 0, opp: 0 }
  ROWS.forEach((r, i) => { if (r.out && t >= start(i) + 1.2) counts[r.out]++ })
  return (
    <div className="sc">
      <div className="sc-panel s3-csv"><span className="sc-label">legacy_export.csv</span></div>
      <svg className={cx('s3-lines', t >= 0.3 && 'on')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="100" d="M72 24 L63 72" />
        <path pathLength="100" d="M72 24 L86 72" />
      </svg>
      <svg className="s3-funnel" viewBox="0 0 100 120" aria-hidden="true"><path d="M2 2H98L62 70V118H38V70Z" /></svg>
      <p className="s3-tag">{tr('sc.dedupe')}</p>
      <p className={cx('sc-pill s3-merge', t >= 1.55 && t < 2.45 && 'on')}>{tr('sc.merged')}</p>
      {ROWS.map((r, i) => {
        const s = start(i)
        const state = t < s ? 'wait' : t < s + 0.45 ? 'mouth' : 'in'
        return (
          <span key={r.text} className={cx('s3-row mv', state, r.dup && 'dup')} style={state === 'wait' ? at(5, 26 + 8 * i) : state === 'mouth' ? at(41, 20) : at(44, 32)}>
            {r.text}
          </span>
        )
      })}
      {Object.entries(OBJECTS).map(([id, o]) => (
        <div key={id} className="sc-panel s3-obj" style={at(o.x, o.y)}>
          <strong>{o.name}</strong>
          <b className={cx(counts[id] && 'ok')}>{counts[id]}</b>
        </div>
      ))}
      {ROWS.map((r, i) => {
        if (!r.out) return null
        const s = start(i)
        const o = OBJECTS[r.out]
        const flying = t >= s + 0.7
        return (
          <span key={r.label} className={cx('s3-out mv', (t < s + 0.6 || t >= s + 1.2) && 'off')} style={flying ? at(o.x, o.y, { '--d': '.5s' }) : at(48, 61)}>
            {r.label}
          </span>
        )
      })}
      <p className={cx('s3-total', t >= 4.6 && 'on')}>{tr('sc.migTotal')}</p>
      <Stamp on={t >= 5.2} className="s3-stamp">{tr('sc.migrated')}</Stamp>
    </div>
  )
}

/* 04 · Service Cloud: cases fall into Omni-Channel and get routed by skill; the outage gets escalated in time. */
// Agent and case names are sc.agents and sc.cases, by index.
const AGENTS = [{ id: 'billing', x: 17 }, { id: 'tech', x: 50 }, { id: 'vip', x: 83 }]
const CASES = [
  { id: '#1042', to: 0 },
  { id: '#1043', to: 1 },
  { id: '#1044', to: 2, urgent: true },
  { id: '#1045', to: 0 },
]

function Dispatch({ t }) {
  const { t: tr } = useLang()
  const names = tr('sc.agents')
  const what = tr('sc.cases')
  const start = (i) => 0.3 + 1.05 * i
  const arrived = (i) => t >= start(i) + 1.1
  const resolved = CASES.filter((c, i) => t >= start(i) + 1.7).length
  const siren = t >= start(2) && t < start(2) + 1.1
  return (
    <div className={cx('sc', siren && 'siren')}>
      <svg className="s4-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {AGENTS.map((a) => <path key={a.id} d={`M50 42 L${a.x} 76`} />)}
      </svg>
      <span className="sc-label s4-incoming">{tr('sc.incoming')}</span>
      <p className={cx('s4-sla', resolved === 4 && 'ok')}>{tr('sc.slaMet')} <b>{resolved}/4</b></p>
      <div className="s4-hub"><span>Omni</span></div>
      <p className={cx('sc-pill s4-escalate', t >= start(2) + 0.2 && t < start(2) + 0.65 && 'on')}>{tr('sc.escalated')}</p>
      {AGENTS.map((a, i) => {
        const mine = CASES.map((c, j) => c.to === i && arrived(j)).filter(Boolean).length
        return (
          <div key={a.id} className="s4-agent" style={at(a.x, 78)}>
            <span className="s4-ring" style={{ '--p': mine ? '100%' : '0%' }}><b>{names[i][0]}</b></span>
            <small>{names[i]}</small>
            {mine > 0 && <em key={mine}>{mine}</em>}
          </div>
        )
      })}
      {CASES.map((c, i) => {
        const s = start(i)
        const p = t < s + 0.15 ? at(50, 17) : t < s + 0.6 ? at(50, 42) : at(AGENTS[c.to].x, 74)
        return (
          <span key={c.id} className={cx('s4-case mv', c.urgent && 'urgent', (t < s || arrived(i)) && 'off')} style={{ ...p, '--d': '.45s' }}>
            <b>{c.id}</b> {what[i]}
          </span>
        )
      })}
      <Stamp on={t >= 5.4} className="s4-stamp">{tr('sc.allResolved')}</Stamp>
    </div>
  )
}

/* 05 · CPQ: a bundle snaps together, the price walks down the waterfall, the quote gets approved. */
// Bar labels are sc.waterfall and the bundle lines sc.bundle, by index; `value` is euros (cuts are negative).
const WATERFALL = [
  { id: 'list', value: 4200, bottom: 0, height: 100, kind: 'base', at: 2.2 },
  { id: 'bundle', value: -300, bottom: 86.4, height: 13.6, kind: 'cut', at: 2.7 },
  { id: 'volume', value: -420, bottom: 67.3, height: 19.1, kind: 'cut', at: 3.2 },
  { id: 'partner', value: -180, bottom: 59.1, height: 8.2, kind: 'cut', at: 3.7 },
  { id: 'net', value: 3300, bottom: 0, height: 59.1, kind: 'net', at: 4.3 },
]
const NET = 3300

function QuoteBuilder({ t }) {
  const { t: tr, money } = useLang()
  const labels = tr('sc.waterfall')
  const blocks = tr('sc.bundle')
  const discount = Math.round(lerp(t, 2.7, 3.9, 0, 21))
  return (
    <div className="sc">
      <div className="sc-panel s5-quote">
        <span className="sc-label">{tr('sc.quote')}</span>
        <div className="s5-blocks">
          {blocks.map((b, i) => <span key={i} className={cx('s5-block', i === 0 && 'main', t >= 0.3 + 0.5 * i && 'in')}>{b}</span>)}
        </div>
        <p className={cx('s5-line', t >= 1 && 'in')}>{tr('sc.rule')}</p>
        <p className={cx('s5-line s5-net', t >= 4.5 && 'in')}>{tr('sc.net')} <b>{money(NET)}</b></p>
        <p className={cx('s5-line', t >= 4.9 && 'in')}>{tr('sc.approval')}</p>
      </div>
      <div className="s5-chart">
        <div className="s5-plot">
          {WATERFALL.map((w, i) => (
            <div key={w.id} className={cx('s5-bar', w.kind, t >= w.at && 'in')} style={{ left: `${i * 20 + 2}%`, bottom: `${w.bottom}%`, height: `${w.height}%` }}>
              <em>{w.value < 0 ? `−${-w.value}` : money(w.value)}</em>
            </div>
          ))}
        </div>
        <div className="s5-labels">{WATERFALL.map((w, i) => <span key={w.id}>{labels[i]}</span>)}</div>
      </div>
      <div className="s5-slider">
        <span className="sc-label">{tr('sc.discount')}</span>
        <i><b style={{ left: `${discount * 4}%` }} /></i>
        <strong>−{discount}%</strong>
      </div>
      <Stamp on={t >= 5.3} className="s5-stamp">{tr('sc.approved')}</Stamp>
    </div>
  )
}

/* 06 · Org health: the radar finds the debt, each issue gets fixed in order and the score climbs. */
// The radar labels are short tech tags (English); the issue lines are sc.issues, by index.
const BLIPS = [
  { x: 30, y: 28, label: 'WF rule', gain: 13 },
  { x: 70, y: 34, label: 'API v29', gain: 13 },
  { x: 64, y: 72, label: '0% cov', gain: 14 },
  { x: 27, y: 66, label: 'Public R/W', gain: 14 },
]

function Sweep({ t }) {
  const { t: tr } = useLang()
  const issues = tr('sc.issues')
  const found = (i) => t >= 0.5 + 0.45 * i
  const fixed = (i) => t >= 3 + 0.6 * i
  const score = Math.round(BLIPS.reduce((s, b, i) => s + lerp(t, 3 + 0.6 * i, 3.3 + 0.6 * i, 0, b.gain), lerp(t, 0.4, 2.2, 100, 42)))
  const tone = score >= 80 && t >= 3 ? 'ok' : score >= 50 ? 'warn' : 'bad'
  const status = tr(t < 2.2 ? 'sc.scanning' : t < 3 ? 'sc.found' : t < 5 ? 'sc.fixing' : 'sc.allClear')
  return (
    <div className="sc">
      <div className="s6-radar">
        <span className="s6-beam" />
        {BLIPS.map((b, i) => (
          <i key={b.label} className={cx(found(i) && 'found', fixed(i) && 'fixed')} style={at(b.x, b.y)}>
            <span>{b.label}</span>
          </i>
        ))}
      </div>
      <div className="s6-side">
        <span className="sc-label">{tr('sc.orgHealth')} · {status}</span>
        <p className={cx('s6-score', tone)}>{score}<small>/ 100</small></p>
        <div className={cx('sc-meter', tone)}><b style={{ width: `${score}%` }} /></div>
        <ul>
          {BLIPS.map((b, i) => (
            <li key={b.label} className={cx(found(i) && 'in', fixed(i) && 'fixed')}>
              <span>{issues[i]}</span>
              <em>{fixed(i) ? tr('sc.fixed') : tr('sc.open')}</em>
            </li>
          ))}
        </ul>
      </div>
      <Stamp on={t >= 5.4} className="s6-stamp">{tr('sc.missionPassed')}</Stamp>
    </div>
  )
}

export const SCENES = { code: Bulkify, integration: PacketRun, data: Shredder, service: Dispatch, cpq: QuoteBuilder, health: Sweep }
