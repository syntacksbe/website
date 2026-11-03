// French site copy: the same shape as content.js (same ids, keys, numbers and icons), only the user-facing
// strings translated. Salesforce product, feature and certification names stay English.
// Written with plain spaces: frTypo adds the no-break spaces French typography needs.
import { LINKEDIN_URL, dotnetStack } from './content.js'
import { frTypo } from './frTypo.js'

export { LINKEDIN_URL, dotnetStack }

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
  'API REST & SOAP',
  'Service Cloud',
  'Salesforce CPQ',
  'Migration de données',
  'Salesforce CLI',
  'Git & CI/CD',
]

export const services = frTypo([
  {
    id: 'code',
    title: 'Développement sur mesure',
    tag: 'Apex · LWC · Async',
    scene: 'Le bulkify',
    text: 'Apex, triggers, traitements batch et asynchrones, et Lightning Web Components : du code bulk-safe, bien testé et maintenable.',
    gear: ['Apex & triggers bulk-safe', 'Lightning Web Components', 'Batch, Queueable & Platform Events'],
    special: 'Une requête pour 200 enregistrements au lieu de 200 requêtes : du code qui tient quand vos données grandissent.',
    cta: { label: 'Jouer aux jeux sur les governor limits', href: 'arcade/#/?c=limits' },
  },
  {
    id: 'integration',
    title: 'Intégrations',
    tag: 'REST · SOAP · Events',
    scene: 'La course aux paquets',
    text: 'Je connecte Salesforce à votre ERP, votre site web et vos autres systèmes via des API REST et SOAP, des callouts et des patterns événementiels, avec des années d’expérience en développement backend.',
    gear: ['API REST & SOAP, dans les deux sens', 'Named Credentials & OAuth', 'Retries, logs & alertes'],
    special: 'Quand l’autre système tombe, rien ne se perd : les appels échoués sont relancés avec backoff et apparaissent dans un log.',
    cta: { label: 'Jouer aux jeux d’intégration', href: 'arcade/#/?c=integration' },
  },
  {
    id: 'data',
    title: 'Architecture & migration de données',
    tag: 'Modèles · LDV · Migration',
    scene: 'La broyeuse',
    text: 'Des modèles de données qui passent à l’échelle, des stratégies pour les gros volumes et des migrations propres et fiables, appuyés par la certification Data Architecture & Management Designer.',
    gear: ['Des modèles de données évolutifs', 'Gros volumes & data skew', 'Migrations avec dédoublonnage & réconciliation'],
    special: 'Des données legacy en vrac à l’entrée, des enregistrements propres et reliés à la sortie, et chaque ligne justifiée.',
    cta: { label: 'Jouer aux jeux de modèle de données', href: 'arcade/#/?c=datamodel' },
  },
  {
    id: 'service',
    title: 'Service Cloud',
    tag: 'Cases · Omni · SLA',
    scene: 'Le dispatch',
    text: 'Gestion des cases, routage, entitlements et automatisation, pour que les équipes support résolvent plus vite les demandes des clients.',
    gear: ['Routage Omni-Channel par compétences', 'Entitlements & milestones', 'Automatisation des cases & Knowledge'],
    special: 'Le bon case arrive chez le bon agent avant la fin du chrono SLA.',
    cta: { label: 'Jouer aux jeux Service Cloud', href: 'arcade/#/?c=service' },
  },
  {
    id: 'cpq',
    title: 'Salesforce CPQ',
    tag: 'Bundles · Pricing · Quotes',
    scene: 'L’atelier des devis',
    text: 'Configuration des produits, des prix et des devis, plus la logique sur mesure qui va autour, pour que votre équipe commerciale fasse des devis justes et rapides.',
    gear: ['Bundles & product rules', 'Price rules & discount schedules', 'Approbations & documents de devis'],
    special: 'Des bundles complexes au bon prix du premier coup, approuvés et envoyés.',
    cta: { label: 'Jouer aux jeux CPQ', href: 'arcade/#/?c=cpq' },
  },
  {
    id: 'health',
    title: 'Santé de l’org & bonnes pratiques',
    tag: 'Reviews · Refactors · Security',
    scene: 'Le grand nettoyage',
    text: 'Revues de code, refactoring et nettoyage de la dette technique, optimisation des Flows et revues de sécurité, pour garder votre org rapide et pérenne.',
    gear: ['Revues de code & de Flows', 'Automatisations legacy vers Flow', 'Corrections sécurité & Health Check'],
    special: 'Je trouve la dette technique, je la corrige par ordre de risque, et je laisse l’org plus propre que je ne l’ai trouvée.',
    cta: { label: 'Faire le bilan de santé', href: '#health-check' },
  },
])

export const certifications = frTypo([
  {
    id: 'admin', name: 'Administrator', short: 'Admin', icon: '🛠️', year: 2019, tier: 2, rarity: 'rare',
    stats: { platform: 30, service: 5, data: 10 },
    forYou: 'Votre org reste bien rangée : utilisateurs, permission sets, validation rules et rapports. Je règle les choses par la configuration avant de passer au code.',
    perks: ['Sécurité & partage', 'Rapports & tableaux de bord', 'La config avant le code'],
  },
  {
    id: 'pd1', name: 'Platform Developer I', short: 'Developer I', icon: '⚡', year: 2019, tier: 4, rarity: 'rare',
    stats: { code: 40, integration: 10, data: 5 },
    forYou: 'De l’Apex et des LWC bulk-safe et bien testés, pour que votre org ne bute pas sur les governor limits quand les données grandissent.',
    perks: ['Apex & triggers', 'Lightning Web Components', 'Des tests qui ont du sens'],
  },
  {
    id: 'service', name: 'Service Cloud Consultant', short: 'Service Cloud', icon: '🎧', year: 2020, tier: 3, rarity: 'epic',
    stats: { platform: 10, integration: 5, service: 60 },
    forYou: 'Cases, routage Omni-Channel, entitlements et Knowledge, configurés selon la façon dont votre équipe support travaille vraiment.',
    perks: ['Gestion des cases', 'Omni-Channel', 'Entitlements & SLA'],
  },
  {
    id: 'pd2', name: 'Platform Developer II', short: 'Developer II', icon: '🔥', year: 2021, tier: 5, rarity: 'epic',
    stats: { code: 40, integration: 45 },
    forYou: 'Les développements difficiles, bien faits : traitements asynchrones, intégrations, optimisation des performances et code sécurisé.',
    perks: ['Batch, Queueable, Platform Events', 'Patterns d’intégration', 'Performance & sécurité'],
  },
  {
    id: 'associate', name: 'Salesforce Associate', short: 'Associate', icon: '☁️', year: 2022, tier: 1, rarity: 'common',
    stats: { platform: 10, service: 5, data: 5 },
    forYou: 'Je connais toute la plateforme, de Sales et Service aux données et à la sécurité. Les ateliers partent d’un vocabulaire commun.',
    perks: ['Vue sur toute la plateforme', 'Fondamentaux CRM'],
  },
  {
    id: 'app-builder', name: 'Platform App Builder', short: 'App Builder', icon: '🧩', year: 2022, tier: 3, rarity: 'rare',
    stats: { platform: 20, code: 10, data: 15 },
    forYou: 'Des objets personnalisés, des pages Lightning et des Flows que vos propres admins peuvent continuer à maintenir après mon départ.',
    perks: ['Modélisation des données', 'Flows & automatisation', 'Pages Lightning'],
  },
  {
    id: 'data-arch', name: 'Data Architecture and Management Designer', short: 'Data Architect', icon: '🏛️', year: 2025, tier: 6, rarity: 'legendary',
    stats: { platform: 10, integration: 15, data: 55 },
    forYou: 'Gros volumes, migrations et qualité des données sans mauvaise surprise à 2 h du matin, et des modèles de partage qui passent à l’échelle.',
    perks: ['Gros volumes de données', 'Stratégie de migration', 'Gouvernance des données'],
  },
])

export const plan = frTypo([
  {
    id: 'own',
    label: 'Je porte la solution',
    blurb: 'Le consultant qui porte la solution, du premier atelier à la passation.',
    missions: [
      {
        title: 'Comprendre',
        objective: 'Cartographier vos processus métier et vos objectifs, et ce qui existe déjà dans votre org, avant que quiconque parle de code.',
        loot: ['Cartographie des processus', 'Revue de votre org', 'Périmètre priorisé'],
        yourPart: ['Un atelier de lancement avec les personnes qui font le travail', 'Un accès en lecture à une sandbox ou à la production'],
        checkpoint: 'Vous validez le périmètre et les priorités.',
      },
      {
        title: 'Concevoir',
        objective: 'Une solution qui utilise les fonctionnalités standard là où elles conviennent, et du code sur mesure là où il apporte une vraie valeur.',
        loot: ['Conception : modèle de données, automatisation, intégrations', 'Estimation par fonctionnalité', 'Risques identifiés tôt'],
        yourPart: ['Relire la conception', 'Trancher les compromis'],
        checkpoint: 'Vous validez la conception avant que je développe.',
      },
      {
        title: 'Bâtir & tester',
        objective: 'Un travail propre, documenté et testé, en itérations courtes, pour que vous voyiez l’avancement tôt et souvent.',
        loot: ['Des fonctionnalités qui tournent dans une sandbox', 'Des tests pour chaque fonctionnalité', 'Une démo à chaque itération'],
        yourPart: ['Essayer chaque démo et donner votre avis', 'Les tests d’acceptation utilisateur'],
        checkpoint: 'Vous validez les tests d’acceptation.',
      },
      {
        title: 'Transmettre',
        objective: 'Déployer en production et faire en sorte que votre équipe puisse s’approprier la solution et la faire évoluer.',
        loot: ['Un déploiement planifié, avec retour arrière possible', 'Documentation', 'Session de transfert de connaissances'],
        yourPart: ['Choisir la fenêtre de mise en production', 'Désigner qui en est responsable ensuite'],
      },
    ],
  },
  {
    id: 'team',
    label: 'Dans votre équipe',
    blurb: 'Un développeur freelance dans votre équipe, qui travaille dans vos sprints, votre repo et votre pipeline.',
    missions: [
      {
        title: 'S’intégrer',
        objective: 'Rejoindre votre équipe et découvrir vite votre org et votre code.',
        loot: ['Une première lecture de votre org et de votre code', 'Risques et questions, soulevés tôt'],
        yourPart: ['Un accès à une sandbox, au repo et au backlog', 'Quelqu’un à qui poser mes questions les premiers jours'],
        checkpoint: 'Je prends le premier ticket.',
      },
      {
        title: 'Affiner',
        objective: 'Façonner les stories avec l’équipe avant qu’elles soient développées.',
        loot: ['Affinage technique et estimations', 'Un avis configuration ou code pour chaque story'],
        yourPart: ['Un backlog priorisé par votre product owner'],
        checkpoint: 'Les stories sont prêtes pour le sprint.',
      },
      {
        title: 'Bâtir & tester',
        objective: 'Livrer des tickets dans vos sprints, à la façon de votre équipe.',
        loot: ['Du code bulk-safe et testé via vos pull requests', 'Des démos à la sprint review'],
        yourPart: ['Les code reviews et les rituels de sprint habituels'],
        checkpoint: 'Votre review et votre pipeline passent au vert.',
      },
      {
        title: 'Transmettre',
        objective: 'Ne rien laisser que je sois le seul à savoir.',
        loot: ['Du code documenté', 'Un walkthrough pour l’équipe', 'Le travail en cours transmis proprement'],
        yourPart: ['La personne qui reprend participe au walkthrough'],
      },
    ],
  },
])

export const tips = frTypo([
  'Je développe dans une sandbox, jamais directement en production.',
  'Chaque fonctionnalité est livrée avec des tests et un petit mode d’emploi.',
  'Vous voyez une démo à chaque itération, pas seulement à la fin.',
  'La configuration d’abord ; le code là où il apporte une vraie valeur.',
  'Pas de dépendance : vos propres admins peuvent maintenir ce que je construis.',
])

export const industries = frTypo([
  {
    icon: 'realEstate', name: 'Immobilier', client: 'Portail immobilier',
    problem: 'Vendre de la publicité aux professionnels et aider les particuliers qui publient une annonce : il fallait une seule org Salesforce pour les deux.',
    built: 'Leur org Salesforce : des devis pour la publicité, et un service client pour les particuliers.',
    result: 'La vente publicitaire et le service client travaillent depuis la même fiche client.',
  },
  {
    icon: 'insurance', name: 'Assurance', client: 'Assureur',
    problem: 'Les sinistres et les questions des clients devaient être traités à temps, par la bonne équipe.',
    built: 'Salesforce pour la gestion des sinistres et le service client.',
    result: 'Sinistres et questions clients traités au même endroit, du premier contact à la clôture.',
  },
  {
    icon: 'mobility', name: 'Mobilité & automobile', client: 'Importateur automobile',
    problem: 'Le parcours d’une voiture touche beaucoup d’équipes : la commande, la livraison et le service après-vente.',
    built: 'Salesforce pour le service client, le processus de commande et de livraison des voitures, et l’après-vente.',
    result: 'Une vue unique du client et de sa voiture, de la commande à l’après-vente.',
  },
])

export const careerStats = [
  { value: 7, label: 'Ans sur Salesforce' },
  { value: 7, label: 'Certifications' },
  { value: 11, label: 'Ans de développement' },
]

export const carriedOver = ['Architecture propre', 'Intégrations robustes', 'Du code fait pour durer']
