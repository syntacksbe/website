// The looping art on each certification card, one scene per certification id in content.js (plus `next`,
// the locked card). Like the services scenes they are drawn from `t`, the seconds since the loop started,
// and CSS transitions do the moving. The art window is small, so scenes are graphic with little text.
// Positions are percentages of the 4:3 window, sizes in cqw (the window is a container).
// Labels come from strings.<lang>.js (cs.*); test names, queries and record data stay English.
import { useLang } from '../i18n.jsx'

export { FINAL, LOOP } from './ServiceScenes.jsx'

const lerp = (t, a, b, from, to) => (t <= a ? from : t >= b ? to : from + ((to - from) * (t - a)) / (b - a))
const at = (x, y, extra) => ({ left: `${x}%`, top: `${y}%`, ...extra })
const cx = (...names) => names.filter(Boolean).join(' ')

function Stamp({ on, children }) {
  return <p className={cx('cs-stamp', on && 'on')}>{children}</p>
}

/* Administrator: a save without a close date is blocked, the field is filled, the record saves. */
function CleanSave({ t }) {
  const { t: tr } = useLang()
  const filled = t >= 3.4
  const error = t >= 1.7 && t < 3.3
  const saved = t >= 4.1
  return (
    <div className="cs">
      <div className={cx('cs-panel cs-form', error && 'shake')}>
        <p><span>{tr('cs.account')}</span><b>Brightline Ltd</b></p>
        <p><span>{tr('cs.stage')}</span><b>Closed Won</b></p>
        <p className={cx(error && 'bad', filled && 'ok')}><span>{tr('cs.closeDate')}</span><b>{filled ? tr('cs.dateValue') : ' '}</b></p>
        <i className={cx('cs-btn', (t >= 1.4 && t < 1.7) || (t >= 3.8 && t < 4.1) ? 'press' : '')}>{tr('cs.save')}</i>
      </div>
      <p className={cx('cs-toast bad', error && 'on')}>{tr('cs.required')}</p>
      <p className={cx('cs-toast ok', saved && 'on')}>{tr('cs.saved')}</p>
      <Stamp on={t >= 4.7}>{tr('cs.cleanData')}</Stamp>
    </div>
  )
}

/* Platform Developer I: four tests go green one by one while the coverage climbs past 75%. */
const TESTS = ['bulkInsert200', 'blocksDuplicates', 'runsAsSalesUser', 'calloutIsMocked']
function GreenTests({ t }) {
  const { t: tr } = useLang()
  const cover = Math.round(lerp(t, 0.6, 3.9, 0, 92))
  return (
    <div className="cs">
      <ul className="cs-panel cs-tests">
        {TESTS.map((name, i) => {
          const start = 0.6 + i * 0.8
          const state = t >= start + 0.6 ? 'pass' : t >= start ? 'run' : ''
          return <li key={name} className={state}><i />{name}()</li>
        })}
      </ul>
      <div className="cs-cover">
        <span className="cs-label">{tr('cs.coverage')}</span>
        <b className={cover >= 75 ? 'ok' : ''}>{cover}%</b>
        <div className="cs-meter"><i style={{ width: `${cover}%` }} /><em style={{ left: '75%' }} /></div>
      </div>
      <Stamp on={t >= 4.5}>{tr('cs.allGreen')}</Stamp>
    </div>
  )
}

/* Service Cloud: cases arrive and Omni-Channel routes each one to the agent with the right skill. */
// Agent colours by index; their skill names are cs.skills.
const AGENTS = ['o', 'g', 't']
const CASES = [[0, 0.5], [2, 1.4], [1, 2.3], [0, 3.2]]
function RouteCases({ t }) {
  const { t: tr } = useLang()
  const skills = tr('cs.skills')
  return (
    <div className="cs">
      <span className="cs-chip" style={at(6, 8)}>Omni-Channel</span>
      <div className="cs-hub" style={at(44, 50)} />
      {AGENTS.map((c, i) => (
        <p key={c} className={cx('cs-agent', c)} style={at(82, 22 + i * 28)}>
          <i>{skills[i][0]}</i>{skills[i]}
        </p>
      ))}
      {CASES.map(([agent, start], i) => {
        const pos = t < start ? [6, 50] : t < start + 0.6 ? [44, 50] : [74, 22 + agent * 28]
        return (
          <i key={i} className={cx('cs-case mv', AGENTS[agent], (t < start || t > start + 1.5) && 'off')}
            style={at(...pos, { '--d': '.55s' })} />
        )
      })}
      <p className="cs-sla" style={at(6, 82)}>SLA <b>{t >= 4 ? tr('cs.met') : `0:${String(Math.max(0, 59 - Math.floor(t * 9))).padStart(2, '0')}`}</b></p>
      <Stamp on={t >= 4.4}>{tr('sc.slaMet')}</Stamp>
    </div>
  )
}

/* Platform Developer II: a batch job works through 10,000 records in chunks of 200. */
function BatchRun({ t }) {
  const { t: tr, num } = useLang()
  const done = Math.min(10000, Math.floor(lerp(t, 0.7, 4.1, 0, 10000) / 200) * 200)
  return (
    <div className="cs">
      <span className="cs-chip" style={at(6, 8)}>Batch · scope 200</span>
      <p className="cs-big" style={at(6, 24)}>{num(done)}<small> / {num(10000)}</small></p>
      <div className="cs-chunks" style={at(6, 56)}>
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={done >= (i + 1) * 1000 ? 'on' : done > i * 1000 ? 'run' : ''} />)}
      </div>
      <p className="cs-note" style={at(6, 76)}>{tr('cs.freshLimits')}</p>
      <Stamp on={t >= 4.6}>{tr('cs.asyncDone')}</Stamp>
    </div>
  )
}

/* Salesforce Associate: the platform's building blocks light up around the cloud. */
// Block positions by index; their names are cs.blocks.
const BLOCKS = [[50, 13], [85, 38], [72, 82], [28, 82], [15, 38]]
function BigPicture({ t }) {
  const { t: tr } = useLang()
  const names = tr('cs.blocks')
  return (
    <div className="cs">
      <svg className="cs-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {BLOCKS.map(([x, y], i) => (
          <line key={i} x1="50" y1="50" x2={x} y2={y} pathLength="1" className={t >= 0.5 + i * 0.6 ? 'on' : ''} />
        ))}
      </svg>
      <p className="cs-cloud" style={at(50, 50)}>☁️</p>
      {BLOCKS.map(([x, y], i) => (
        <span key={i} className={cx('cs-block', t >= 0.7 + i * 0.6 && 'on')} style={at(x, y)}>{names[i]}</span>
      ))}
      <Stamp on={t >= 4.4}>{tr('cs.bigPicture')}</Stamp>
    </div>
  )
}

/* Platform App Builder: components drop from the palette into a Lightning page, then it goes live. */
const box = (x, y, w, h) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` })
const PARTS = [
  ['Path', box(5, 20, 17, 13), box(29, 12, 64, 15)],
  ['Record', box(5, 38, 17, 13), box(29, 32, 31, 37)],
  ['Related', box(5, 56, 17, 13), box(62, 32, 31, 37)],
]
function PageBuild({ t }) {
  const { t: tr } = useLang()
  return (
    <div className="cs">
      <div className="cs-panel cs-palette" style={box(3, 8, 21, 66)}><span className="cs-label">{tr('cs.drag')}</span></div>
      <div className="cs-panel cs-page" style={box(26, 8, 70, 66)} />
      {PARTS.map(([name, , slot]) => <i key={name} className="cs-slot" style={slot} />)}
      {PARTS.map(([name, from, slot], i) => (
        <span key={name} className={cx('cs-part mv', t >= 0.8 + i && 'placed')} style={{ ...(t >= 0.8 + i ? slot : from), '--d': '.5s' }}>
          {name}
        </span>
      ))}
      <i className={cx('cs-btn cs-activate', t >= 3.8 && t < 4.1 && 'press', t >= 4.1 && 'live')}>{t >= 4.1 ? tr('cs.live') : tr('cs.activate')}</i>
      <Stamp on={t >= 4.6}>{tr('cs.noCode')}</Stamp>
    </div>
  )
}

/* Data Architect: a query over 10 million rows crawls, an index goes on, it flies. */
function FastQuery({ t }) {
  const { t: tr, num } = useLang()
  const indexed = t >= 2.6
  const slow = lerp(t, 0.4, 2.2, 0, 12.4)
  return (
    <div className="cs">
      <span className="cs-chip" style={at(6, 8)}>{tr('cs.rows10m')}</span>
      <p className="cs-query" style={at(6, 24)}>WHERE Region__c = 'EU'</p>
      <div className={cx('cs-timer', indexed ? 'ok' : slow > 8 ? 'bad' : '')} style={at(6, 46)}>
        <i style={{ width: indexed ? '2%' : `${(slow / 12.4) * 100}%` }} />
        <b>{indexed ? `${num(0.08, 2)} s` : `${num(slow, 1)} s`}</b>
      </div>
      <p className={cx('cs-index', t >= 2.3 && 'on')} style={at(6, 70)}>{tr('cs.indexed')}</p>
      <Stamp on={t >= 4.3}>{tr('cs.scales')}</Stamp>
    </div>
  )
}

/* The locked card: the next unlock is the visitor's own project. */
function Locked({ t }) {
  const { t: tr } = useLang()
  return (
    <div className="cs cs-locked">
      {[[18, 22], [80, 20], [14, 74], [84, 72]].map(([x, y], i) => (
        <span key={i} className={cx('cs-q', Math.floor(t * 2 + i) % 4 === 0 && 'on')} style={at(x, y)}>?</span>
      ))}
      <p className="cs-lock" style={at(50, 44)}>🔒</p>
      <p className={cx('cs-press', t >= 2 && 'on')} style={at(50, 80)}>{tr('cs.pressStart')}</p>
    </div>
  )
}

export const SCENES = {
  admin: CleanSave,
  pd1: GreenTests,
  service: RouteCases,
  pd2: BatchRun,
  associate: BigPicture,
  'app-builder': PageBuild,
  'data-arch': FastQuery,
  next: Locked,
}
