// The org health check as plain data and scoring, without React, so the PDF and a future learning site can reuse it.
// Every check is phrased as the healthy state: "Yes" means it holds in your org.
// `where` is what to type in Setup's Quick Find box (or where else to look), `why` says what Salesforce enforces or
// flags, `fix` is the concrete next step. `na` adds a "doesn't apply" answer for checks that not every org needs.
// This file is the English source; healthChecks.nl.js and healthChecks.fr.js hold the Dutch and French text by id,
// and healthCheck(lang) merges them in. The ids, severities, weights and scoring stay here.
import nl from './healthChecks.nl.js'
import fr from './healthChecks.fr.js'

export const SEVERITY = {
  critical: { label: 'Critical', weight: 4 },
  high: { label: 'High', weight: 2 },
  medium: { label: 'Medium', weight: 1 },
}

export const AREAS = [
  {
    id: 'security',
    name: 'Security',
    intro: 'Start in Setup › Health Check: it scores your settings against the Salesforce Baseline Standard.',
    checks: [
      {
        id: 'mfa',
        severity: 'critical',
        topic: 'MFA for every login',
        check: 'Every user who logs in to the UI uses MFA, either in Salesforce or through your SSO provider.',
        where: ['Identity Verification', 'Login History'],
        why: 'Salesforce requires MFA for all user interface logins. A stolen password alone should never be enough to get in.',
        fix: 'Turn on the org-wide MFA requirement for direct UI logins in Identity Verification, and make sure your SSO provider enforces MFA for SSO users.',
      },
      {
        id: 'baseline',
        severity: 'high',
        topic: 'Health Check high risks',
        check: 'Setup › Health Check shows no High-Risk settings.',
        where: ['Health Check'],
        why: 'Health Check compares your security settings with the Salesforce Baseline Standard and flags each one as a high, medium or low risk.',
        fix: 'Fix every High-Risk setting first (Fix Risks handles several in one go), then work through the Medium-Risk ones.',
      },
      {
        id: 'connected-apps',
        severity: 'high',
        topic: 'Connected apps',
        check: 'Every connected app is known and still used, and access is limited to pre-authorised users where possible.',
        where: ['Connected Apps OAuth Usage', 'Manage Connected Apps'],
        why: 'Connected apps hold OAuth tokens that reach your data without a password or MFA prompt. A forgotten one is a quiet back door.',
        fix: "Block apps nobody uses, and set the rest to 'Admin approved users are pre-authorized' with access through a permission set.",
      },
      {
        id: 'session',
        severity: 'medium',
        topic: 'Session settings',
        check: 'Session Settings show no risks in Health Check: a session timeout, force logout on timeout, clickjack protection and HttpOnly cookies.',
        where: ['Session Settings'],
        why: 'Locked-down sessions limit what a stolen session cookie or an unattended laptop can do.',
        fix: 'Set a timeout that fits your users, and turn on Force logout on session timeout, clickjack protection and the HttpOnly attribute.',
      },
      {
        id: 'password',
        severity: 'medium',
        topic: 'Password policies',
        check: 'Password Policies meet the baseline for length, complexity, expiry and lockout after failed attempts.',
        where: ['Password Policies', 'Health Check'],
        why: 'Weak policies show up as risks in Health Check, and they protect every user who does not log in through SSO.',
        fix: 'Copy the values Health Check expects into the org-wide Password Policies, and override them on profiles only where you must.',
      },
      {
        id: 'trusted-ip',
        severity: 'medium',
        topic: 'Trusted IP ranges',
        check: 'Trusted IP ranges in Network Access are narrow, and no range covers the whole internet.',
        where: ['Network Access'],
        why: 'From a trusted IP range, users skip the identity verification challenge on a new device. A huge range switches that check off for everyone.',
        fix: 'Delete the broad ranges and keep only your office or VPN exit addresses.',
      },
    ],
  },
  {
    id: 'code',
    name: 'Code & API',
    intro: 'Sort by the API Version column in Apex Classes and Apex Triggers, then look at who calls your APIs.',
    checks: [
      {
        id: 'retired-api',
        severity: 'critical',
        topic: 'Retired API versions',
        check: 'No integration calls a SOAP, REST or Bulk API version of 30.0 or lower.',
        where: ['Event Monitoring: API Total Usage log', 'your integration settings'],
        why: "Salesforce retired API versions 21.0 to 30.0 in Summer '25. Calls to a retired version fail.",
        fix: 'Find the callers in the API Total Usage event log, move each one to a current API version and retest it.',
      },
      {
        id: 'coverage',
        severity: 'critical',
        topic: 'Apex code coverage',
        check: 'Org-wide Apex coverage is above 75%, and every trigger is covered by tests.',
        where: ["Apex Classes › Estimate your organization's code coverage", 'Apex Test Execution'],
        why: 'Salesforce blocks production deployments below 75% org-wide coverage, and every trigger needs some coverage. You find out on release day.',
        fix: 'Run all tests, list the classes and triggers under 75%, and write tests with real assertions for those first.',
      },
      {
        id: 'hardcoded',
        severity: 'high',
        topic: 'Hard-coded IDs and URLs',
        check: 'No record IDs, user IDs or URLs are hard-coded in Apex, flows or formulas; endpoints and secrets live in Named Credentials.',
        where: ['Named Credentials', 'Remote Site Settings', 'a code search for IDs and https://'],
        why: 'IDs and URLs differ between orgs and change with a refresh or a domain change, so hard-coded ones break silently. Secrets in code end up in every sandbox.',
        fix: 'Move endpoints and credentials to Named Credentials with External Credentials, and look up IDs by developer name or from custom metadata.',
      },
      {
        id: 'oauth',
        severity: 'high',
        topic: 'Integration logins',
        check: 'Integrations authenticate with OAuth, not with a stored username, password and security token.',
        where: ['Login History (Login Type, Application)', 'Users'],
        why: "Password logins break when a password expires or resets, and Salesforce has scheduled the SOAP login() call for retirement in Summer '27.",
        fix: 'Give each integration its own integration user and an OAuth flow such as client credentials or JWT bearer, set up as an external client app or connected app.',
      },
      {
        id: 'api-version',
        severity: 'medium',
        topic: 'Old Apex API versions',
        check: 'No Apex class or trigger is saved on API version 30.0 or lower, and most code is on a version from the last few years.',
        where: ['Apex Classes (API Version column)', 'Apex Triggers', 'Visualforce Pages'],
        why: 'Code keeps the behaviour of the API version it was saved with, so very old versions miss years of platform changes and stand out in every review.',
        fix: 'Bump the oldest files a few versions at a time and run the tests after each step.',
      },
    ],
  },
  {
    id: 'automation',
    name: 'Automation',
    intro: 'Open the automation lists per object: what runs when a record saves, and in what order.',
    checks: [
      {
        id: 'legacy-automation',
        severity: 'high',
        topic: 'Workflow Rules and Process Builder',
        check: 'No Workflow Rules or Process Builder processes are still active.',
        where: ['Workflow Rules', 'Process Builder', 'Migrate to Flow'],
        why: 'Salesforce ended support for Workflow Rules and Process Builder on 31 December 2025. They still run, but bugs in them no longer get fixed.',
        fix: 'Use Migrate to Flow per rule or process, merge the results into one record-triggered flow per object, test, then deactivate the old ones.',
      },
      {
        id: 'one-trigger',
        severity: 'high',
        topic: 'One trigger per object',
        check: 'Each object has at most one Apex trigger, with the logic in a handler class.',
        where: ['Apex Triggers (sort by object)'],
        why: "Salesforce doesn't guarantee the order in which several triggers on one object run, so behaviour can change between deployments.",
        fix: 'Merge them into one trigger per object that calls a handler class, and move the logic over one context at a time.',
      },
      {
        id: 'flow-order',
        severity: 'medium',
        topic: 'Flow trigger order',
        check: 'Record-triggered flows on the same object have an explicit trigger order, and same-record updates run before save.',
        where: ['Flows › Flow Trigger Explorer'],
        why: "Without a trigger order, flows on one object run in an order you didn't choose. Before-save updates are much faster than after-save ones.",
        fix: 'Give each flow a Trigger Order in Flow Trigger Explorer, and move same-record field updates to a Fast Field Updates flow.',
      },
      {
        id: 'error-email',
        severity: 'medium',
        topic: 'Failure alerts',
        check: 'Flow and Apex failure emails reach someone who reads them, or failures land in a log you check.',
        where: ['Process Automation Settings', 'Apex Exception Email'],
        why: 'By default these emails can go to whoever last changed the flow or class, who may have left long ago.',
        fix: 'Send flow errors and Apex exceptions to the admin team, and add fault paths to flows that call out or update other records.',
      },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    intro: 'Storage Usage first, then the objects with the most records.',
    checks: [
      {
        id: 'storage',
        severity: 'high',
        topic: 'Storage used',
        check: 'Data storage and file storage are each below 80% of your allocation.',
        where: ['Storage Usage'],
        why: 'Storage fills up faster than people expect and extra storage is costly. Over the limit, saves start failing with a storage limit error.',
        fix: 'Check the top objects on Storage Usage, archive or delete old logs, tasks and emails, and set a retention rule so it does not creep back.',
      },
      {
        id: 'backup',
        severity: 'high',
        topic: 'Backup and restore',
        check: "Data and metadata are backed up, and you've restored from a backup at least once.",
        where: ['Data Export', 'your backup tool'],
        why: 'Salesforce keeps the platform running, but bringing back records a user or an integration deleted or overwrote is your job.',
        fix: 'Schedule backups of data and metadata, and restore a sample into a sandbox every quarter.',
      },
      {
        id: 'skew',
        severity: 'medium',
        topic: 'Data skew',
        check: 'No user owns more than 10,000 records of one object, and no account has more than 10,000 child records.',
        where: ['Reports grouped by owner or by account'],
        why: 'Salesforce calls this data skew. Above about 10,000 records per owner or parent, sharing recalculations slow down and record locks appear.',
        fix: 'Spread records over more owners or parents. If one integration user must own them, give it no role or one at the top of the hierarchy.',
      },
      {
        id: 'fields',
        severity: 'medium',
        topic: 'Custom field limits',
        check: 'No object is close to its custom field limit, and unused fields get removed.',
        where: ['Object Manager › object › Object Limits'],
        why: 'The custom field limit per object depends on your edition, and deleted fields keep counting until they are erased for good.',
        fix: 'Check Object Limits on your biggest objects, use Where is this used? on suspect fields, and remove the ones nobody uses.',
      },
      {
        id: 'duplicates',
        severity: 'medium',
        topic: 'Duplicate rules',
        check: 'Matching and duplicate rules are active for accounts, contacts and leads.',
        where: ['Duplicate Rules', 'Matching Rules'],
        why: 'Duplicates split the history of one customer across records, skew reports and send the same person two emails.',
        fix: 'Turn on the standard matching rules, start with a duplicate rule that only alerts, and block once the data is clean.',
      },
    ],
  },
  {
    id: 'access',
    name: 'Access',
    intro: 'Who can see and change what: sharing settings, admins, profiles and licences.',
    checks: [
      {
        id: 'admins',
        severity: 'critical',
        topic: 'Admin rights',
        check: 'Only a handful of named people have System Administrator, Modify All Data or View All Data.',
        where: ['Users (filter by profile)', 'Permission Sets'],
        why: 'Modify All Data can change or export every record. Each extra admin account is one more target worth stealing.',
        fix: 'List everyone with Modify All Data, View All Data or Customize Application, remove the ones who do not need it, and use a temporary permission set for one-off work.',
      },
      {
        id: 'owd',
        severity: 'high',
        topic: 'Org-wide defaults',
        check: 'No object holding customer or financial data has an org-wide default of Public Read/Write.',
        where: ['Sharing Settings'],
        why: 'Public Read/Write lets every internal user edit every record of that object, whatever their role.',
        fix: 'Set those objects to Private or Public Read Only, and open access back up with roles, sharing rules or teams.',
      },
      {
        id: 'guest',
        severity: 'high',
        topic: 'Guest user access',
        na: 'No public sites',
        check: 'Guest users on your sites and Experience Cloud sites have no object access beyond what the public pages need.',
        where: ['All Sites › guest user profile', 'Digital Experiences'],
        why: 'A guest profile works without any login. Salesforce locked guest sharing down, but object and field permissions are still yours to set.',
        fix: "Remove object permissions the pages don't use from each guest profile, then test the site in a private browser window.",
      },
      {
        id: 'permsets',
        severity: 'medium',
        topic: 'Profiles vs permission sets',
        check: 'Access comes mainly from permission sets and permission set groups, on top of a few minimal profiles.',
        where: ['Profiles', 'Permission Set Groups'],
        why: 'Salesforce recommends minimal profiles with access from permission sets. Dozens of copied profiles make every change risky.',
        fix: 'Grant new access in permission sets, bundle them per role in permission set groups, and retire copied profiles one team at a time.',
      },
      {
        id: 'idle-users',
        severity: 'medium',
        topic: 'Idle licences',
        check: 'Every active user has logged in within the last 90 days.',
        where: ['Users (Last Login column)', 'a report on users'],
        why: "Active users hold a licence whether they log in or not, and freezing a user doesn't free it. Idle accounts are easy to misuse too.",
        fix: 'Report on Last Login, deactivate leavers (freeze first if they own records or jobs) and hand the licences to someone who needs them.',
      },
    ],
  },
  {
    id: 'platform',
    name: 'Platform',
    intro: 'Release updates, retired features and the limits that only show up when you hit them.',
    checks: [
      {
        id: 'legacy-chat',
        severity: 'critical',
        topic: 'Legacy Chat',
        na: 'Never used Chat',
        check: 'Your website and service team no longer rely on Legacy Chat (Live Agent).',
        where: ['Chat Settings', 'Embedded Service Deployments'],
        why: 'Salesforce retired Legacy Chat in February 2026. Messaging for In-App and Web replaces it.',
        fix: 'Set up Messaging for In-App and Web with an Embedded Service deployment and Omni-Channel routing, then replace the snippet on your site.',
      },
      {
        id: 'release-updates',
        severity: 'high',
        topic: 'Release updates',
        check: 'Every release update near its enforcement date has been tested in a sandbox.',
        where: ['Release Updates'],
        why: 'Salesforce switches each release update on automatically on its enforcement date, tested or not.',
        fix: 'Test each pending release update in a sandbox, then enable it in production yourself before Salesforce does.',
      },
      {
        id: 'api-usage',
        severity: 'medium',
        topic: 'Daily API usage',
        check: 'API requests in the last 24 hours stay well below your daily limit.',
        where: ['Company Information', 'System Overview', 'API Usage Notifications'],
        why: 'API usage grows quietly with every new integration, and integrations that burn through the allocation risk being blocked.',
        fix: 'Find the heaviest callers, move chatty syncs to Bulk API or change events, and add an API usage notification at 80%.',
      },
      {
        id: 'async-jobs',
        severity: 'medium',
        topic: 'Scheduled and batch jobs',
        check: 'Scheduled and batch Apex jobs finish without failures, and none run as an inactive user.',
        where: ['Apex Jobs', 'Scheduled Jobs'],
        why: "A failed nightly job doesn't show up anywhere a user looks. You notice when the data is already wrong.",
        fix: 'Check Apex Jobs for failures in the last week, add error handling that logs or alerts, and reschedule jobs under an active user.',
      },
      {
        id: 'debug-logs',
        severity: 'medium',
        topic: 'Debug logs',
        check: 'No trace flags stay on for weeks, and no debug statement writes personal data or secrets to the logs.',
        where: ['Debug Logs'],
        why: 'Debug logs show whatever your code writes, including tokens and personal data, to anyone who can open them.',
        fix: 'Remove old trace flags, and strip System.debug lines that print request bodies or credentials.',
      },
    ],
  },
]

export const CHECKS = AREAS.flatMap((a) => a.checks.map((c) => ({ ...c, area: a.id, areaName: a.name })))

// The result screen's verdict. `critical` is the warn text when a critical check failed.
const GRADES = {
  good: { label: 'Healthy org', stamp: 'MISSION PASSED', text: 'Your org is in good shape. Fix the few open items and keep checking every release.' },
  warn: {
    label: 'Room to improve',
    stamp: 'ALMOST THERE',
    text: 'Solid foundations, but technical debt is building up.',
    critical: 'Solid in places, but a critical item is open. Fix that before anything else.',
  },
  bad: { label: 'Needs attention', stamp: 'WASTED', text: 'Several checks Salesforce enforces are failing. Expect blocked deployments, broken integrations or security findings.' },
}

// Unanswered and "Not sure" both count as a small part of a pass: you can't fix what you haven't looked at.
const POINTS = { yes: 1, no: 0, unsure: 0.25 }

const scoreOf = (checks, answers) => {
  const scored = checks.filter((c) => answers[c.id] !== 'na')
  const max = scored.reduce((s, c) => s + SEVERITY[c.severity].weight, 0)
  if (!max) return null
  const got = scored.reduce((s, c) => s + SEVERITY[c.severity].weight * (POINTS[answers[c.id]] ?? POINTS.unsure), 0)
  return Math.round((got / max) * 100)
}

// The check in one language: the English source with the overlay's text on top (ids, severity and weights stay).
function build(overlay) {
  if (!overlay) return { SEVERITY, AREAS, CHECKS, GRADES }
  const severity = Object.fromEntries(Object.entries(SEVERITY).map(([k, s]) => [k, { ...s, label: overlay.severity?.[k] ?? s.label }]))
  const areas = AREAS.map((a) => {
    const ao = overlay.areas?.[a.id] ?? {}
    return {
      ...a,
      name: ao.name ?? a.name,
      intro: ao.intro ?? a.intro,
      checks: a.checks.map((c) => {
        const co = overlay.checks?.[c.id] ?? {}
        return {
          ...c,
          topic: co.topic ?? c.topic,
          check: co.check ?? c.check,
          why: co.why ?? c.why,
          fix: co.fix ?? c.fix,
          where: co.where ?? c.where,
          ...(c.na ? { na: co.na ?? c.na } : {}),
        }
      }),
    }
  })
  const grades = Object.fromEntries(Object.entries(GRADES).map(([k, g]) => [k, { ...g, ...overlay.grades?.[k] }]))
  return {
    SEVERITY: severity,
    AREAS: areas,
    CHECKS: areas.flatMap((a) => a.checks.map((c) => ({ ...c, area: a.id, areaName: a.name }))),
    GRADES: grades,
  }
}

const OVERLAYS = { nl, fr }
const cache = {}

// Everything the health check needs in one language ('en' | 'nl' | 'fr'): SEVERITY, AREAS and CHECKS with the
// translated text, plus grade() and evaluate() that return translated labels.
export function healthCheck(lang = 'en') {
  if (cache[lang]) return cache[lang]
  const { SEVERITY: sev, AREAS: areas, CHECKS: checks, GRADES: grades } = build(OVERLAYS[lang])

  const gradeFor = (score, criticalFails = 0) => {
    if (score >= 80 && criticalFails === 0) return { cls: 'good', label: grades.good.label, stamp: grades.good.stamp, text: grades.good.text }
    if (score >= 50) return { cls: 'warn', label: grades.warn.label, stamp: grades.warn.stamp, text: criticalFails ? grades.warn.critical : grades.warn.text }
    return { cls: 'bad', label: grades.bad.label, stamp: grades.bad.stamp, text: grades.bad.text }
  }

  // Everything the result screen and the PDF need, from a map of check id → 'yes' | 'no' | 'unsure' | 'na'.
  const evaluateIn = (answers) => {
    const rank = { critical: 0, high: 1, medium: 2 }
    const fixes = checks.filter((c) => answers[c.id] !== 'yes' && answers[c.id] !== 'na')
      .map((c) => ({ ...c, status: answers[c.id] === 'no' ? 'fail' : 'unknown' }))
      .sort((a, b) => rank[a.severity] - rank[b.severity] || (a.status === 'fail' ? 0 : 1) - (b.status === 'fail' ? 0 : 1))
    const criticalFails = fixes.filter((f) => f.severity === 'critical' && f.status === 'fail').length
    const score = scoreOf(checks, answers) ?? 100
    const areaScores = areas.map((a) => {
      const s = scoreOf(a.checks, answers)
      return {
        id: a.id,
        name: a.name,
        score: s,
        cls: s === null ? 'na' : s >= 80 ? 'good' : s >= 50 ? 'warn' : 'bad',
        fixes: fixes.filter((f) => f.area === a.id).length,
      }
    })
    return { score, grade: gradeFor(score, criticalFails), areas: areaScores, fixes, criticalFails }
  }

  cache[lang] = { SEVERITY: sev, AREAS: areas, CHECKS: checks, grade: gradeFor, evaluate: evaluateIn }
  return cache[lang]
}

// English shortcuts, as before.
export function grade(score, criticalFails = 0, lang = 'en') {
  return healthCheck(lang).grade(score, criticalFails)
}

export function evaluate(answers, lang = 'en') {
  return healthCheck(lang).evaluate(answers)
}
