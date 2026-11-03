// The five homepage demos, joining their Arcade category as simulations (plain data, so
// scripts/check-arcade.mjs can read it too).
export const DEMOS = {
  limits: { id: 'limits-demo-governor', title: 'Governor limit lab', blurb: 'Break five classic Apex limits, pick the fix and run it at scale.', level: 2 },
  integration: { id: 'integration-demo-architect', title: 'Integration architect', blurb: 'Design an order sync and stress-test it against peaks and outages.', level: 2 },
  datamodel: { id: 'datamodel-demo-architect', title: 'Model three industries', blurb: 'Explore real industry data models and ace the architect challenges.', level: 2 },
  service: { id: 'service-demo-shift', title: 'Service desk shift', blurb: 'Run a Monday at the service desk: routing, SLAs and escalation, live.', level: 1 },
  sales: { id: 'sales-demo-quarter', title: 'Pipeline quarter', blurb: 'Hit an €850k quota with lead assignment, scoring and quotes.', level: 1 },
}
