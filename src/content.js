// All site copy lives here so it can be updated without touching the components.

export const LINKEDIN_URL = 'https://www.linkedin.com/in/marcmmm/'

// The slowly scrolling tech line under the hero.
export const technologies = [
  'Apex',
  'Lightning Web Components',
  'Flow Builder',
  'Validation Rules',
  'Permission Sets & Sharing',
  'Lightning App Builder',
  'SOQL',
  'GraphQL',
  'Batch & Queueable Apex',
  'Platform Events',
  'REST & SOAP APIs',
  'Service Cloud',
  'Salesforce CPQ',
  'Data Migration',
  'Salesforce CLI',
  'Git & CI/CD',
]

// The services loadout. Each one has a looping scene (src/components/ServiceScenes.jsx, by id), three pieces of
// "gear" and a button to its category in the Arcade (or, for org health, to the health check).
export const services = [
  {
    id: 'code',
    title: 'Custom development',
    tag: 'Apex · LWC · Async',
    scene: 'The bulkify',
    text: 'Apex, triggers, batch and asynchronous processing, and Lightning Web Components — bulk-safe, well-tested and maintainable.',
    gear: ['Bulk-safe Apex & triggers', 'Lightning Web Components', 'Batch, Queueable & Platform Events'],
    special: 'One query for 200 records instead of 200 queries: code that keeps working when your data grows.',
    cta: { label: 'Play the governor limits games', href: 'arcade/#/?c=limits' },
  },
  {
    id: 'integration',
    title: 'Integrations',
    tag: 'REST · SOAP · Events',
    scene: 'The packet run',
    text: 'Connect Salesforce with your ERP, website and other systems through REST and SOAP APIs, callouts and event-driven patterns — drawing on years of backend development in C# and .NET.',
    gear: ['REST & SOAP APIs, both ways', 'Named Credentials & OAuth', 'Retries, logging & alerts'],
    special: 'When the other system goes down, nothing gets lost: failed calls retry with backoff and show up in a log.',
    cta: { label: 'Play the integration games', href: 'arcade/#/?c=integration' },
  },
  {
    id: 'data',
    title: 'Data architecture & migration',
    tag: 'Models · LDV · Migration',
    scene: 'The shredder',
    text: 'Data models that scale, large-data-volume strategies, and clean, reliable migrations — backed by the Data Architecture & Management Designer certification.',
    gear: ['Data models that scale', 'Large data volumes & skew', 'Migrations with dedupe & reconciliation'],
    special: 'Messy legacy data in, clean related records out, and every row accounted for.',
    cta: { label: 'Play the data model games', href: 'arcade/#/?c=datamodel' },
  },
  {
    id: 'service',
    title: 'Service Cloud',
    tag: 'Cases · Omni · SLAs',
    scene: 'The dispatch',
    text: 'Case management, routing, entitlements and automation that help support teams resolve customer issues faster.',
    gear: ['Omni-Channel skills routing', 'Entitlements & milestones', 'Case automation & knowledge'],
    special: 'The right case reaches the right agent before the SLA clock runs out.',
    cta: { label: 'Play the Service Cloud games', href: 'arcade/#/?c=service' },
  },
  {
    id: 'cpq',
    title: 'Salesforce CPQ',
    tag: 'Bundles · Pricing · Quotes',
    scene: 'The quote builder',
    text: 'Product, pricing and quoting configuration, plus the custom logic around it, so your sales team can quote accurately and quickly.',
    gear: ['Bundles & product rules', 'Price rules & discount schedules', 'Approvals & quote documents'],
    special: 'Complex bundles priced right the first time, approved and out the door.',
    cta: { label: 'Play the CPQ games', href: 'arcade/#/?c=cpq' },
  },
  {
    id: 'health',
    title: 'Org health & best practices',
    tag: 'Reviews · Refactors · Security',
    scene: 'The sweep',
    text: 'Code reviews, refactoring and technical-debt cleanup, Flow optimisation and security reviews to keep your org fast and future-proof.',
    gear: ['Code & Flow reviews', 'Legacy automation to Flow', 'Security & Health Check fixes'],
    special: 'I find the technical debt, fix it in order of risk, and leave the org cleaner than I found it.',
    cta: { label: 'Run the org health check', href: '#health-check' },
  },
]

// The certification cards, in the order they were earned (the deck deals them in this order).
// tier is the step in the Salesforce path (1 = basics … 6 = architect); rarity colours the card:
// common | rare | epic | legendary. stats is what the card adds to each bar in STATS (Certifications.jsx).
export const certifications = [
  {
    id: 'admin', name: 'Administrator', short: 'Admin', icon: '🛠️', year: 2019, tier: 2, rarity: 'rare',
    stats: { platform: 30, service: 5, data: 10 },
    forYou: 'Your org stays tidy: users, permission sets, validation rules and reports. I fix things with configuration before I reach for code.',
    perks: ['Security & sharing', 'Reports & dashboards', 'Config before code'],
  },
  {
    id: 'pd1', name: 'Platform Developer I', short: 'Developer I', icon: '⚡', year: 2019, tier: 4, rarity: 'rare',
    stats: { code: 40, integration: 10, data: 5 },
    forYou: "Apex and LWC that are bulk-safe and properly tested, so your org doesn't hit governor limits when the data grows.",
    perks: ['Apex & triggers', 'Lightning Web Components', 'Meaningful tests'],
  },
  {
    id: 'service', name: 'Service Cloud Consultant', short: 'Service Cloud', icon: '🎧', year: 2020, tier: 3, rarity: 'epic',
    stats: { platform: 10, integration: 5, service: 60 },
    forYou: 'Cases, Omni-Channel routing, entitlements and knowledge, set up the way your support team actually works.',
    perks: ['Case management', 'Omni-Channel', 'Entitlements & SLAs'],
  },
  {
    id: 'pd2', name: 'Platform Developer II', short: 'Developer II', icon: '🔥', year: 2021, tier: 5, rarity: 'epic',
    stats: { code: 40, integration: 45 },
    forYou: 'The hard builds done right: async processing, integrations, performance tuning and secure code.',
    perks: ['Batch, Queueable, Platform Events', 'Integration patterns', 'Performance & security'],
  },
  {
    id: 'associate', name: 'Salesforce Associate', short: 'Associate', icon: '☁️', year: 2022, tier: 1, rarity: 'common',
    stats: { platform: 10, service: 5, data: 5 },
    forYou: 'I know the whole platform, from Sales and Service to data and security. Workshops start from a shared vocabulary.',
    perks: ['Platform-wide view', 'CRM fundamentals'],
  },
  {
    id: 'app-builder', name: 'Platform App Builder', short: 'App Builder', icon: '🧩', year: 2022, tier: 3, rarity: 'rare',
    stats: { platform: 20, code: 10, data: 15 },
    forYou: 'Custom objects, Lightning pages and Flows that your own admins can keep maintaining after I leave.',
    perks: ['Data modelling', 'Flows & automation', 'Lightning pages'],
  },
  {
    id: 'data-arch', name: 'Data Architecture and Management Designer', short: 'Data Architect', icon: '🏛️', year: 2025, tier: 6, rarity: 'legendary',
    stats: { platform: 10, integration: 15, data: 55 },
    forYou: 'Large data volumes, migrations and data quality without the 2 a.m. surprises, and sharing models that scale.',
    perks: ['Large data volumes', 'Migration strategy', 'Data governance'],
  },
]

// "How we'll work together" as a heist plan: two ways of working (the two from the services intro), each a
// route of four missions. A mission says what it's for, what you get and what I need from you; the checkpoint
// after it is where you decide before the next one starts.
export const plan = [
  {
    id: 'own',
    label: 'I own the solution',
    blurb: 'The consultant who owns the solution, from the first workshop to the handover.',
    missions: [
      {
        title: 'Understand',
        objective: "Map your business process and goals, and what's already in your org, before anyone talks about code.",
        loot: ['Process map', 'Review of your org', 'Prioritised scope'],
        yourPart: ['A kickoff workshop with the people who do the work', 'Read access to a sandbox or production'],
        checkpoint: 'You agree on the scope and the priorities.',
      },
      {
        title: 'Design',
        objective: 'A solution that uses standard features where they fit and custom code where it adds real value.',
        loot: ['Solution design: data model, automation, integrations', 'Estimate per feature', 'Risks, named early'],
        yourPart: ['Review the design', 'Decide on the trade-offs'],
        checkpoint: 'You approve the design before I build.',
      },
      {
        title: 'Build & test',
        objective: 'Clean, documented, tested work in short iterations, so you see progress early and often.',
        loot: ['Working features in a sandbox', 'Tests for every feature', 'A demo every iteration'],
        yourPart: ['Try each demo and give feedback', 'User acceptance testing'],
        checkpoint: 'You sign off the acceptance tests.',
      },
      {
        title: 'Hand over',
        objective: 'Deploy to production and make sure your team can own and extend the solution.',
        loot: ['A planned deployment with a way back', 'Documentation', 'Knowledge-transfer session'],
        yourPart: ['Pick the release window', 'Name who owns it from here'],
      },
    ],
  },
  {
    id: 'team',
    label: 'In your team',
    blurb: 'A freelance developer in your team, working in your sprints, your repo and your pipeline.',
    missions: [
      {
        title: 'Onboard',
        objective: 'Join your team and get to know your org and your code fast.',
        loot: ['A first read of your org and codebase', 'Risks and questions, raised early'],
        yourPart: ['Access to a sandbox, the repo and the backlog', 'Someone to ask in the first days'],
        checkpoint: 'I pick up the first ticket.',
      },
      {
        title: 'Refine',
        objective: 'Shape the stories with the team before they are built.',
        loot: ['Technical refinement and estimates', 'Configuration-or-code advice per story'],
        yourPart: ['A prioritised backlog from your product owner'],
        checkpoint: 'The stories are ready for the sprint.',
      },
      {
        title: 'Build & test',
        objective: 'Deliver tickets in your sprints, the way your team works.',
        loot: ['Bulk-safe, tested code through your pull requests', 'Demos at the sprint review'],
        yourPart: ['Code reviews and the usual sprint rituals'],
        checkpoint: 'Your review and your pipeline pass.',
      },
      {
        title: 'Hand over',
        objective: 'Leave nothing that only I know.',
        loot: ['Documented code', 'A walkthrough for the team', 'Open work handed over cleanly'],
        yourPart: ['Whoever takes over joins the walkthrough'],
      },
    ],
  },
]

// Loading-screen tips under the plan.
export const tips = [
  'I build in a sandbox, never straight in production.',
  'Every feature ships with tests and a short how-to.',
  'You see a demo every iteration, not just at the end.',
  'Configuration first; code where it adds real value.',
  'No lock-in: your own admins can maintain what I build.',
]

// Shown in the "Before Salesforce" block of the Experience section.
export const dotnetStack = ['C#', '.NET', 'ASP.NET MVC', 'Web API', 'Xamarin', 'Azure', 'SQL']

// The industries, each shown as a redacted case file in the Experience section. Client names are never shown
// (content rule: no former employers); `client` is only a generic description. icon keys map to the SVGs in
// components/Experience.jsx. Set `draft: true` on a file to show a "Draft" tag while its text is unconfirmed.
export const industries = [
  {
    icon: 'realEstate', name: 'Real estate', client: 'Property portal',
    problem: 'Selling advertising to professionals and helping private clients who place ads needed one Salesforce org.',
    built: 'Their Salesforce org: quotes for advertising, and customer care for private clients.',
    result: 'Ad sales and customer care work from the same customer record.',
  },
  {
    icon: 'insurance', name: 'Insurance', client: 'Insurer',
    problem: 'Insurance claims and customer questions had to be handled on time, by the right team.',
    built: 'Salesforce for claims handling and customer care.',
    result: 'Claims and customer questions handled in one place, from first contact to closure.',
  },
  {
    icon: 'mobility', name: 'Mobility & automotive', client: 'Car importer',
    problem: "A car's journey touches many teams: the order, the delivery and the service afterwards.",
    built: 'Salesforce for customer care, the car order and delivery process, and after-sales.',
    result: 'One view of the customer and their car, from order to after-sales.',
  },
]

// The career stats at the top of the Experience section (counted up when they scroll into view).
export const careerStats = [
  { value: 7, label: 'Years on Salesforce' },
  { value: 7, label: 'Certifications' },
  { value: 11, label: 'Years building software' },
]

// Carried over from the .NET years into the Salesforce work ("New Game+" in the Before Salesforce card).
export const carriedOver = ['Clean architecture', 'Robust integrations', 'Code built to last']
