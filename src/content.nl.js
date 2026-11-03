// Dutch (Belgian) site copy: the same shape as content.js (same ids, keys, numbers and icons), only the
// user-facing strings translated. Salesforce product, feature and certification names stay English.
export { LINKEDIN_URL, dotnetStack } from './content.js'

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
  'Datamigratie',
  'Salesforce CLI',
  'Git & CI/CD',
]

export const services = [
  {
    id: 'code',
    title: 'Ontwikkeling op maat',
    tag: 'Apex · LWC · Async',
    scene: 'De bulkify',
    text: 'Apex, triggers, batch- en asynchrone verwerking, en Lightning Web Components: bulk-safe, goed getest en onderhoudbaar.',
    gear: ['Bulk-safe Apex & triggers', 'Lightning Web Components', 'Batch, Queueable & Platform Events'],
    special: 'Eén query voor 200 records in plaats van 200 queries: code die blijft werken als je data groeit.',
    cta: { label: 'Speel de governor limits-games', href: 'arcade/#/?c=limits' },
  },
  {
    id: 'integration',
    title: 'Integraties',
    tag: 'REST · SOAP · Events',
    scene: 'De pakketrace',
    text: "Ik koppel Salesforce aan je ERP, je website en andere systemen via REST- en SOAP-API's, callouts en event-driven patronen, met jaren ervaring in backendontwikkeling.",
    gear: ["REST & SOAP API's, in beide richtingen", 'Named Credentials & OAuth', 'Retries, logging & alerts'],
    special: 'Ligt het andere systeem plat, dan gaat er niets verloren: mislukte calls proberen opnieuw met backoff en komen in een log terecht.',
    cta: { label: 'Speel de integratiegames', href: 'arcade/#/?c=integration' },
  },
  {
    id: 'data',
    title: 'Data-architectuur & migratie',
    tag: 'Modellen · LDV · Migratie',
    scene: 'De versnipperaar',
    text: 'Datamodellen die schalen, strategieën voor grote datavolumes, en nette, betrouwbare migraties, onderbouwd met de certificering Data Architecture & Management Designer.',
    gear: ['Datamodellen die schalen', 'Grote datavolumes & skew', 'Migraties met ontdubbeling & reconciliatie'],
    special: 'Rommelige legacydata erin, nette gekoppelde records eruit, en elke rij verantwoord.',
    cta: { label: 'Speel de datamodelgames', href: 'arcade/#/?c=datamodel' },
  },
  {
    id: 'service',
    title: 'Service Cloud',
    tag: "Cases · Omni · SLA's",
    scene: 'De dispatch',
    text: 'Casebeheer, routering, entitlements en automatisering waarmee supportteams klantvragen sneller oplossen.',
    gear: ['Omni-Channel skills routing', 'Entitlements & milestones', 'Case-automatisering & Knowledge'],
    special: 'De juiste case komt bij de juiste agent terecht voor de SLA-klok afloopt.',
    cta: { label: 'Speel de Service Cloud-games', href: 'arcade/#/?c=service' },
  },
  {
    id: 'cpq',
    title: 'Salesforce CPQ',
    tag: 'Bundles · Pricing · Quotes',
    scene: 'De offertebouwer',
    text: 'Configuratie van producten, prijzen en offertes, plus de maatwerklogica eromheen, zodat je salesteam snel en correct offertes maakt.',
    gear: ['Bundles & product rules', 'Price rules & discount schedules', 'Goedkeuringen & offertedocumenten'],
    special: 'Complexe bundles meteen juist geprijsd, goedgekeurd en de deur uit.',
    cta: { label: 'Speel de CPQ-games', href: 'arcade/#/?c=cpq' },
  },
  {
    id: 'health',
    title: 'Gezonde org & best practices',
    tag: 'Reviews · Refactors · Security',
    scene: 'De grote schoonmaak',
    text: 'Code reviews, refactoring en het opruimen van technische schuld, Flow-optimalisatie en security reviews, zodat je org snel en toekomstbestendig blijft.',
    gear: ['Code- & Flow-reviews', 'Legacy-automatisering naar Flow', 'Security- & Health Check-fixes'],
    special: 'Ik spoor de technische schuld op, los ze op volgens risico en laat je org properder achter dan ik ze vond.',
    cta: { label: 'Doe de gezondheidscheck', href: '#health-check' },
  },
]

export const certifications = [
  {
    id: 'admin', name: 'Administrator', short: 'Admin', icon: '🛠️', year: 2019, tier: 2, rarity: 'rare',
    stats: { platform: 30, service: 5, data: 10 },
    forYou: 'Je org blijft netjes: gebruikers, permission sets, validation rules en rapporten. Ik los dingen op met configuratie voor ik naar code grijp.',
    perks: ['Security & sharing', 'Rapporten & dashboards', 'Configuratie voor code'],
  },
  {
    id: 'pd1', name: 'Platform Developer I', short: 'Developer I', icon: '⚡', year: 2019, tier: 4, rarity: 'rare',
    stats: { code: 40, integration: 10, data: 5 },
    forYou: 'Apex en LWC die bulk-safe en degelijk getest zijn, zodat je org geen governor limits raakt als de data groeit.',
    perks: ['Apex & triggers', 'Lightning Web Components', 'Zinvolle tests'],
  },
  {
    id: 'service', name: 'Service Cloud Consultant', short: 'Service Cloud', icon: '🎧', year: 2020, tier: 3, rarity: 'epic',
    stats: { platform: 10, integration: 5, service: 60 },
    forYou: 'Cases, Omni-Channel-routering, entitlements en Knowledge, ingericht zoals je supportteam echt werkt.',
    perks: ['Casebeheer', 'Omni-Channel', "Entitlements & SLA's"],
  },
  {
    id: 'pd2', name: 'Platform Developer II', short: 'Developer II', icon: '🔥', year: 2021, tier: 5, rarity: 'epic',
    stats: { code: 40, integration: 45 },
    forYou: 'De moeilijke builds, goed gedaan: asynchrone verwerking, integraties, performance tuning en veilige code.',
    perks: ['Batch, Queueable, Platform Events', 'Integratiepatronen', 'Performance & security'],
  },
  {
    id: 'associate', name: 'Salesforce Associate', short: 'Associate', icon: '☁️', year: 2022, tier: 1, rarity: 'common',
    stats: { platform: 10, service: 5, data: 5 },
    forYou: 'Ik ken het hele platform, van Sales en Service tot data en security. Workshops vertrekken van een gedeelde woordenschat.',
    perks: ['Zicht op het hele platform', 'CRM-basis'],
  },
  {
    id: 'app-builder', name: 'Platform App Builder', short: 'App Builder', icon: '🧩', year: 2022, tier: 3, rarity: 'rare',
    stats: { platform: 20, code: 10, data: 15 },
    forYou: "Custom objects, Lightning-pagina's en Flows die je eigen admins kunnen blijven onderhouden als ik weg ben.",
    perks: ['Datamodellering', 'Flows & automatisering', "Lightning-pagina's"],
  },
  {
    id: 'data-arch', name: 'Data Architecture and Management Designer', short: 'Data Architect', icon: '🏛️', year: 2025, tier: 6, rarity: 'legendary',
    stats: { platform: 10, integration: 15, data: 55 },
    forYou: "Grote datavolumes, migraties en datakwaliteit zonder verrassingen om 2 uur 's nachts, en sharingmodellen die schalen.",
    perks: ['Grote datavolumes', 'Migratiestrategie', 'Data governance'],
  },
]

export const plan = [
  {
    id: 'own',
    label: 'Ik neem de oplossing op mij',
    blurb: 'De consultant die de oplossing in handen neemt, van de eerste workshop tot de overdracht.',
    missions: [
      {
        title: 'Begrijpen',
        objective: 'Je bedrijfsproces en doelen in kaart brengen, en wat er al in je org zit, nog voor iemand over code praat.',
        loot: ['Procesmap', 'Review van je org', 'Scope met prioriteiten'],
        yourPart: ['Een kick-offworkshop met de mensen die het werk doen', 'Leestoegang tot een sandbox of productie'],
        checkpoint: 'Je gaat akkoord met de scope en de prioriteiten.',
      },
      {
        title: 'Ontwerpen',
        objective: 'Een oplossing die standaardfuncties gebruikt waar ze passen, en maatwerkcode waar die echt iets toevoegt.',
        loot: ['Oplossingsontwerp: datamodel, automatisering, integraties', 'Schatting per functionaliteit', "Risico's, vroeg benoemd"],
        yourPart: ['Het ontwerp nalezen', 'Beslissen over de afwegingen'],
        checkpoint: 'Je keurt het ontwerp goed voor ik bouw.',
      },
      {
        title: 'Bouwen & testen',
        objective: 'Net, gedocumenteerd en getest werk in korte iteraties, zodat je vroeg en vaak vooruitgang ziet.',
        loot: ['Werkende functionaliteit in een sandbox', 'Tests voor elke functionaliteit', 'Een demo bij elke iteratie'],
        yourPart: ['Elke demo uitproberen en feedback geven', 'User acceptance testing'],
        checkpoint: 'Je keurt de acceptatietests goed.',
      },
      {
        title: 'Overdragen',
        objective: 'Uitrollen naar productie en ervoor zorgen dat je team de oplossing zelf kan beheren en uitbreiden.',
        loot: ['Een geplande deployment met een weg terug', 'Documentatie', 'Sessie kennisoverdracht'],
        yourPart: ['Het releasemoment kiezen', 'Aanduiden wie het vanaf nu beheert'],
      },
    ],
  },
  {
    id: 'team',
    label: 'In jouw team',
    blurb: 'Een freelance developer in je team, die meedraait in jullie sprints, jullie repo en jullie pipeline.',
    missions: [
      {
        title: 'Instappen',
        objective: 'Aansluiten bij je team en snel je org en je code leren kennen.',
        loot: ['Een eerste lezing van je org en codebase', "Risico's en vragen, vroeg op tafel"],
        yourPart: ['Toegang tot een sandbox, de repo en de backlog', 'Iemand bij wie ik de eerste dagen terechtkan'],
        checkpoint: 'Ik neem het eerste ticket op.',
      },
      {
        title: 'Verfijnen',
        objective: 'De stories samen met het team vormgeven voor ze gebouwd worden.',
        loot: ['Technische refinement en schattingen', 'Per story advies: configuratie of code'],
        yourPart: ['Een geprioriteerde backlog van je product owner'],
        checkpoint: 'De stories zijn klaar voor de sprint.',
      },
      {
        title: 'Bouwen & testen',
        objective: 'Tickets opleveren in jullie sprints, zoals je team werkt.',
        loot: ['Bulk-safe, geteste code via jullie pull requests', "Demo's op de sprint review"],
        yourPart: ['Code reviews en de gewone sprintrituelen'],
        checkpoint: 'Jullie review en pipeline zijn groen.',
      },
      {
        title: 'Overdragen',
        objective: 'Niets achterlaten dat alleen ik weet.',
        loot: ['Gedocumenteerde code', 'Een walkthrough voor het team', 'Lopend werk netjes overgedragen'],
        yourPart: ['Wie het overneemt, zit mee in de walkthrough'],
      },
    ],
  },
]

export const tips = [
  'Ik bouw in een sandbox, nooit rechtstreeks in productie.',
  'Elke feature komt met tests en een korte handleiding.',
  'Je ziet een demo bij elke iteratie, niet pas op het einde.',
  'Eerst configuratie; code waar het echt iets toevoegt.',
  'Geen lock-in: je eigen admins kunnen onderhouden wat ik bouw.',
]

export const industries = [
  {
    icon: 'realEstate', name: 'Vastgoed', client: 'Vastgoedportaal',
    problem: 'Advertenties verkopen aan professionals én particulieren helpen die een zoekertje plaatsen: dat moest in één Salesforce-org.',
    built: 'Hun Salesforce-org: offertes voor advertenties en klantenservice voor particulieren.',
    result: 'Advertentieverkoop en klantenservice werken vanuit hetzelfde klantrecord.',
  },
  {
    icon: 'insurance', name: 'Verzekeringen', client: 'Verzekeraar',
    problem: 'Schadedossiers en klantvragen moesten op tijd behandeld worden, door het juiste team.',
    built: 'Salesforce voor schadebehandeling en klantenservice.',
    result: 'Schadedossiers en klantvragen op één plek behandeld, van eerste contact tot afsluiting.',
  },
  {
    icon: 'mobility', name: 'Mobiliteit & automotive', client: 'Auto-invoerder',
    problem: 'De reis van een auto raakt veel teams: de bestelling, de levering en de service achteraf.',
    built: 'Salesforce voor klantenservice, het bestel- en leverproces van de auto, en after-sales.',
    result: 'Eén zicht op de klant en zijn auto, van bestelling tot after-sales.',
  },
]

export const careerStats = [
  { value: 7, label: 'Jaar op Salesforce' },
  { value: 7, label: 'Certificeringen' },
  { value: 11, label: 'Jaar software bouwen' },
]

export const carriedOver = ['Nette architectuur', 'Robuuste integraties', 'Code die lang meegaat']
