import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game.jsx'
import Quest from './Quest.jsx'
import { highlight } from '../highlight.jsx'

// Every run processes one Data Loader batch: Salesforce runs triggers in chunks of 200 records.
const N = 200
const MAX_LOG = 4

const line = (text, kind) => ({ text, kind })

// Each scenario: naive vs fixed code, three candidate fixes, and a simulator.
// sim(mode) → { steps, failAt, usage(step), log(step) }; failAt is the step that breaks the limit.
const SCENARIOS = [
  {
    id: 'soql',
    title: 'SOQL in a loop',
    file: 'CaseTrigger.trigger',
    gauges: [
      { key: 'soql', label: 'SOQL queries', limit: 100 },
      { key: 'cpu', label: 'CPU time', limit: 10000, unit: ' ms' },
    ],
    error: 'Too many SOQL queries: 101',
    naive: `trigger CaseTrigger on Case (before insert) {
  for (Case c : Trigger.new) {
    // one query per record
    Account a = [SELECT Tier__c FROM Account
                 WHERE Id = :c.AccountId];
    c.Priority = a.Tier__c == 'Gold' ? 'High' : 'Medium';
  }
}`,
    fixed: `trigger CaseTrigger on Case (before insert) {
  Set<Id> ids = new Set<Id>();
  for (Case c : Trigger.new) ids.add(c.AccountId);

  // one query for the whole batch
  Map<Id, Account> accounts = new Map<Id, Account>(
    [SELECT Tier__c FROM Account WHERE Id IN :ids]);

  for (Case c : Trigger.new) {
    c.Priority = accounts.get(c.AccountId).Tier__c == 'Gold'
      ? 'High' : 'Medium';
  }
}`,
    options: [
      { text: 'Wrap the query in try/catch', why: 'Limit exceptions can’t be caught.' },
      { text: 'Query once before the loop and use a Map', correct: true, why: 'One query per batch, however many records.' },
      { text: 'Move the logic to @future for higher limits', why: 'Async allows 200 queries — it still breaks at scale.' },
    ],
    sim(mode) {
      if (mode === 'naive') {
        return {
          steps: 101,
          failAt: 101,
          usage: (s) => ({ soql: s, cpu: s * 7 }),
          log: (s) => [line(`SOQL #${s} | SELECT Tier__c FROM Account WHERE Id = :c.AccountId`)],
        }
      }
      return {
        steps: N,
        failAt: null,
        usage: (s) => ({ soql: s ? 1 : 0, cpu: Math.round(12 + s * 0.4) }),
        log: (s) => (s === 1 ? [line('SOQL #1 | SELECT Tier__c FROM Account WHERE Id IN :ids')] : []),
      }
    },
  },
  {
    id: 'dml',
    title: 'DML in a loop',
    file: 'OpportunityTrigger.trigger',
    gauges: [
      { key: 'dml', label: 'DML statements', limit: 150 },
      { key: 'cpu', label: 'CPU time', limit: 10000, unit: ' ms' },
    ],
    error: 'Too many DML statements: 151',
    naive: `trigger OpportunityTrigger on Opportunity (after insert) {
  for (Opportunity o : Trigger.new) {
    Task t = new Task(WhatId = o.Id, Subject = 'Follow up');
    insert t; // one DML statement per record
  }
}`,
    fixed: `trigger OpportunityTrigger on Opportunity (after insert) {
  List<Task> tasks = new List<Task>();
  for (Opportunity o : Trigger.new) {
    tasks.add(new Task(WhatId = o.Id, Subject = 'Follow up'));
  }
  insert tasks; // one DML statement for the whole batch
}`,
    options: [
      { text: 'Use Database.insert(t, false) instead', why: 'Still one DML statement per record.' },
      { text: 'Split the logic over two triggers', why: 'Both triggers share the same transaction limits.' },
      { text: 'Collect the Tasks in a List, insert once', correct: true, why: 'One DML statement for the whole batch.' },
    ],
    sim(mode) {
      if (mode === 'naive') {
        return {
          steps: 151,
          failAt: 151,
          usage: (s) => ({ dml: s, cpu: s * 5 }),
          log: (s) => [line(`DML #${s} | Insert Task · 1 row`)],
        }
      }
      return {
        steps: N,
        failAt: null,
        usage: (s) => ({ dml: s === N ? 1 : 0, cpu: Math.round(8 + s * 0.3) }),
        log: (s) => (s === N ? [line(`DML #1 | Insert Task · ${N} rows`)] : []),
      }
    },
  },
  {
    id: 'callout',
    title: 'Callouts in a loop',
    file: 'OrderSyncBatch.cls',
    gauges: [
      { key: 'callouts', label: 'Callouts', limit: 100 },
      { key: 'cpu', label: 'CPU time', limit: 60000, unit: ' ms' },
    ],
    error: 'Too many callouts: 101',
    naive: `public void execute(Database.BatchableContext bc,
                    List<Order> scope) {
  for (Order o : scope) {
    HttpRequest req = new HttpRequest();
    req.setEndpoint('callout:ERP/orders');
    req.setMethod('POST');
    req.setBody(JSON.serialize(o));
    new Http().send(req); // one callout per order
  }
}`,
    fixed: `public void execute(Database.BatchableContext bc,
                    List<Order> scope) {
  HttpRequest req = new HttpRequest();
  req.setEndpoint('callout:ERP/orders/bulk');
  req.setMethod('POST');
  req.setBody(JSON.serialize(scope)); // all orders at once
  new Http().send(req);
}`,
    options: [
      { text: 'Send each order via its own @future call', why: 'Only 50 @future calls are allowed — it breaks sooner.' },
      { text: 'Raise the callout timeout', why: 'The number of callouts is the problem, not the time.' },
      { text: 'Send all orders in one bulk request', correct: true, why: 'One callout per batch, whatever its size.' },
    ],
    sim(mode) {
      if (mode === 'naive') {
        return {
          steps: 101,
          failAt: 101,
          usage: (s) => ({ callouts: s, cpu: s * 4 }),
          log: (s) => [line(`CALLOUT #${s} | POST callout:ERP/orders`)],
        }
      }
      return {
        steps: N,
        failAt: null,
        usage: (s) => ({ callouts: s === N ? 1 : 0, cpu: Math.round(s * 0.5) }),
        log: (s) => (s === N ? [line(`CALLOUT #1 | POST callout:ERP/orders/bulk · ${N} orders`)] : []),
      }
    },
  },
  {
    id: 'cpu',
    title: 'CPU time',
    file: 'DiscountService.cls',
    gauges: [
      { key: 'cpu', label: 'CPU time', limit: 10000, unit: ' ms' },
      { key: 'soql', label: 'SOQL queries', limit: 100 },
    ],
    error: 'Apex CPU time limit exceeded',
    naive: `for (Opportunity o : Trigger.new) {
  for (Discount_Rule__c r : allRules) { // 2,000 rules
    if (r.Product_Family__c == o.Product_Family__c
        && r.Region__c == o.Region__c) {
      o.Discount__c = r.Percent__c;
    }
  }
}`,
    fixed: `Map<String, Decimal> discountByKey = new Map<String, Decimal>();
for (Discount_Rule__c r : allRules) {
  discountByKey.put(r.Product_Family__c + '|' + r.Region__c,
                    r.Percent__c);
}
for (Opportunity o : Trigger.new) {
  o.Discount__c = discountByKey.get(
    o.Product_Family__c + '|' + o.Region__c);
}`,
    options: [
      { text: 'Index the rules in a Map, one lookup per record', correct: true, why: 'From 2,000 comparisons per record to one lookup.' },
      { text: 'Move the matching logic into a Flow', why: 'Flow CPU time counts toward the same limit.' },
      { text: 'Add a break after the first match', why: 'Helps a bit, but it’s still records × rules.' },
    ],
    sim(mode) {
      if (mode === 'naive') {
        return {
          steps: 182,
          failAt: 182,
          usage: (s) => ({ cpu: 40 + s * 55, soql: 1 }),
          log: (s) => [line(`LOOP | record ${s}: 2,000 comparisons · ${(40 + s * 55).toLocaleString('en')} ms`)],
        }
      }
      return {
        steps: N,
        failAt: null,
        usage: (s) => ({ cpu: 40 + Math.round(s * 0.2), soql: 1 }),
        log: (s) => (s === 1 ? [line('MAP | 2,000 rules indexed')] : s === N ? [line(`LOOKUP | ${N} records matched`)] : []),
      }
    },
  },
  {
    id: 'recursion',
    title: 'Trigger recursion',
    file: 'AccountTrigger.trigger',
    gauges: [
      { key: 'depth', label: 'Trigger depth', limit: 16 },
      { key: 'dml', label: 'DML statements', limit: 150 },
    ],
    error: 'Maximum trigger depth exceeded',
    naive: `trigger AccountTrigger on Account (after update) {
  List<Account> toUpdate = new List<Account>();
  for (Account a : Trigger.new) {
    toUpdate.add(new Account(Id = a.Id,
                             Last_Synced__c = System.now()));
  }
  update toUpdate; // fires AccountTrigger again… and again
}`,
    fixed: `trigger AccountTrigger on Account (before update) {
  for (Account a : Trigger.new) {
    // set the field before save: no extra DML, no re-fire
    a.Last_Synced__c = System.now();
  }
}`,
    options: [
      { text: 'Add a static Boolean guard', why: 'A classic trap: it also skips the 2nd chunk of 200 records.' },
      { text: 'Set the field in before update — no DML', correct: true, why: 'No DML means the trigger never fires again.' },
      { text: 'Catch the exception and retry', why: 'Retrying just recurses again.' },
    ],
    sim(mode) {
      if (mode === 'naive') {
        return {
          steps: 17,
          failAt: 17,
          usage: (s) => ({ depth: s, dml: s }),
          log: (s) => [line(`TRIGGER | AccountTrigger after update · depth ${s}`)],
        }
      }
      return {
        steps: 1,
        failAt: null,
        usage: () => ({ depth: 1, dml: 0 }),
        log: () => [line(`TRIGGER | AccountTrigger before update · ${N} records, no DML`)],
      }
    },
  },
]

function Gauge({ label, used, limit, unit = '' }) {
  const pct = Math.min(100, (used / limit) * 100)
  const level = used > limit ? 'over' : pct >= 70 ? 'warn' : 'ok'
  return (
    <div className={`gauge ${level}`}>
      <div className="gauge-top">
        <span>{label}</span>
        <span className="gauge-num">
          {used.toLocaleString('en')}{unit} / {limit.toLocaleString('en')}{unit}
        </span>
      </div>
      <div className="gauge-bar"><span style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

const HINTS = [
  'Run the naive code on 200 records — a normal Data Loader batch.',
  'It broke in production. Pick the fix you would ship.',
  'Now run my fix on the same 200 records.',
  null,
]

export default function GovernorDemo() {
  const game = useGame()
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [p, setP] = useState(0)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const [wrong, setWrong] = useState(null) // index of the last wrong pick
  const [misses, setMisses] = useState({}) // scenario id → wrong picks so far
  const frame = useRef(0)

  const sc = SCENARIOS.find((s) => s.id === scenarioId)
  const flag = (what, id = sc.id) => `lim:${id}:${what}`
  // 0 break it · 1 pick the fix · 2 run my fix · 3 solved
  const stage = game.has(flag('solved')) ? 3 : game.has(flag('fix')) ? 2 : game.has(flag('broke')) ? 1 : 0
  const mode = stage >= 2 ? 'fixed' : 'naive'
  const sim = sc.sim(mode)
  const usage = p ? sim.usage(p) : Object.fromEntries(sc.gauges.map((g) => [g.key, 0]))
  const failedNow = mode === 'naive' && p > 0 && p === sim.failAt
  const nextUnsolved = SCENARIOS.find((s) => !game.has(flag('solved', s.id)))
  const solvedCount = SCENARIOS.filter((s) => game.has(flag('solved', s.id))).length

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function clear() {
    cancelAnimationFrame(frame.current)
    setRunning(false)
    setP(0)
    setLog([])
    setWrong(null)
  }

  function pickScenario(id) {
    setScenarioId(id)
    clear()
  }


  function pick(option, index) {
    if (option.correct) {
      game.mark(flag('fix'))
      if (!misses[sc.id]) game.mark('limit-sharp')
      clear()
    } else {
      setWrong(index)
      setMisses({ ...misses, [sc.id]: (misses[sc.id] ?? 0) + 1 })
    }
  }

  function finish() {
    setRunning(false)
    if (sim.failAt !== null) {
      game.mark(flag('broke'))
      game.mark('limit-hit')
    } else {
      game.mark(flag('solved'))
      game.mark('limit-fix')
      if (SCENARIOS.every((s) => game.has(flag('solved', s.id)))) game.mark('limit-all')
    }
  }

  function run() {
    cancelAnimationFrame(frame.current)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduce ? 0 : 1800
    const start = performance.now()
    let done = 0
    setRunning(true)
    setP(0)
    setLog([])

    const tick = (now) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1
      const next = Math.round(t * sim.steps)
      if (next > done) {
        const lines = []
        for (let s = done + 1; s <= next; s++) lines.push(...sim.log(s))
        setLog((l) => [...l, ...lines].slice(-MAX_LOG))
        setP(next)
        done = next
      }
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else finish()
    }
    frame.current = requestAnimationFrame(tick)
  }

  return (
    <>
      <div className="missions" role="group" aria-label="Missions">
        {SCENARIOS.map((s, i) => {
          const solved = game.has(flag('solved', s.id))
          return (
            <button
              type="button"
              key={s.id}
              className={`mission${solved ? ' solved' : ''}${s.id === sc.id ? ' active' : ''}`}
              aria-pressed={s.id === sc.id}
              onClick={() => pickScenario(s.id)}
            >
              <span className="mission-num">{solved ? '✓' : i + 1}</span>
              {s.title}
            </button>
          )
        })}
        <span className="missions-count">{solvedCount}/{SCENARIOS.length} solved</span>
      </div>

      <div className="demo">
        <div className="code-card demo-code" key={`${sc.id}-${mode}`}>
          <div className="code-head">
            <span /><span /><span />
            <p>{sc.file}</p>
            <b className={`code-tag ${mode}`}>{mode === 'naive' ? 'Naive code' : 'My fix ✓'}</b>
          </div>
          <pre><code>{highlight(mode === 'naive' ? sc.naive : sc.fixed)}</code></pre>
        </div>

        <div className={`demo-panel${failedNow && !running ? ' shake' : ''}`}>
          <Quest steps={['Break it', 'Pick the fix', 'Run my fix']} current={stage} hint={HINTS[stage]} />

          <div className="gauges">
            {sc.gauges.map((g) => (
              <Gauge key={g.key} label={g.label} used={usage[g.key]} limit={g.limit} unit={g.unit} />
            ))}
          </div>

          <div className="log" aria-hidden="true">
            {log.length === 0 && <div className="dim">{N} records ready…</div>}
            {log.map((l, i) => <div key={i}>{l.text}</div>)}
          </div>

          <div className="stage" aria-live="polite">
            {stage === 0 && (
              <button type="button" className="btn btn-primary run" onClick={run} disabled={running}>
                {running ? 'Running…' : 'Run naive code'}
              </button>
            )}

            {stage === 1 && (
              <>
                <p className="stage-error">💥 {sc.error} — nothing was saved.</p>
                <div className="options">
                  {sc.options.map((o, i) => (
                    <button
                      type="button"
                      key={o.text}
                      className={`option${wrong === i ? ' wrong' : ''}`}
                      onClick={() => pick(o, i)}
                    >
                      <span className="option-key">{String.fromCharCode(65 + i)}</span>
                      {o.text}
                    </button>
                  ))}
                </div>
                {wrong !== null && <p className="stage-why">✗ {sc.options[wrong].why} Try another.</p>}
              </>
            )}

            {stage === 2 && (
              <>
                <p className="stage-ok">✓ Right — {sc.options.find((o) => o.correct).why}</p>
                <button type="button" className="btn btn-primary run" onClick={run} disabled={running}>
                  {running ? 'Running…' : 'Run my fix'}
                </button>
              </>
            )}

            {stage === 3 && (
              <>
                <p className="stage-ok">
                  {nextUnsolved ? `🎉 Solved — ${N} records, well within the limits.` : '🧙 All five missions solved!'}
                </p>
                {nextUnsolved && (
                  <button type="button" className="btn btn-primary run" onClick={() => pickScenario(nextUnsolved.id)}>
                    Next mission: {nextUnsolved.title} →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
