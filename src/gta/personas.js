// The three characters of the character wheel and the eight tools of the tool wheel.
// A character lights up the services it's best at and re-colours the Services section (data-persona in gta.css).
// Names and taglines are GTA_TEXT.<lang>.personas; tool names GTA_TEXT.<lang>.tools.
export const PERSONAS = [
  { id: 'developer', icon: '⌨️', services: ['code', 'integration', 'data'], stats: { code: 95, architecture: 70, integration: 85, coaching: 60 } },
  { id: 'architect', icon: '🏛️', services: ['data', 'integration', 'health'], stats: { code: 75, architecture: 95, integration: 85, coaching: 70 } },
  { id: 'coach', icon: '🧭', services: ['service', 'cpq', 'health'], stats: { code: 55, architecture: 75, integration: 60, coaching: 95 } },
]

export const personaById = (id) => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]

// `service` is the homepage service it opens, `arcade` the Arcade route it filters or plays.
export const TOOLS = [
  { id: 'apex', icon: '⚡', service: 'code', arcade: '#/?c=limits' },
  { id: 'flow', icon: '🔀', service: 'code', arcade: '#/play/deployment-flow-factory' },
  { id: 'lwc', icon: '🧩', service: 'code', arcade: '#/play/deployment-lwc-launchpad' },
  { id: 'integration', icon: '🔌', service: 'integration', arcade: '#/?c=integration' },
  { id: 'data', icon: '🏛️', service: 'data', arcade: '#/?c=datamodel' },
  { id: 'service', icon: '🎧', service: 'service', arcade: '#/?c=service' },
  { id: 'cpq', icon: '🧾', service: 'cpq', arcade: '#/?c=cpq' },
  { id: 'devops', icon: '🚀', service: 'health', arcade: '#/?c=deployment' },
]
