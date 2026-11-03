// "Wire it up": connect systems and Salesforce features on a board of 2–4 columns.
// Round: { q, nodes: [{ id, label, icon, col: 0–3 }], answer: [[fromId, toId], …], why }
// Wires always flow from an earlier column to a later one; at least one node is a decoy (in no wire).
const str = (v) => typeof v === 'string' && v.trim().length > 0

export default {
  label: 'Wire it up',
  icon: '🔌',
  rounds: [3, 6],
  checkRound(round) {
    const problems = []
    if (!str(round?.q)) problems.push('missing q')
    const nodes = round?.nodes
    if (!Array.isArray(nodes) || nodes.length < 4 || nodes.length > 10) return [...problems, 'needs 4–10 nodes']

    const col = {}
    nodes.forEach((n, i) => {
      if (!str(n?.id)) problems.push(`node ${i + 1}: missing id`)
      if (!str(n?.label)) problems.push(`node ${n?.id ?? i + 1}: missing label`)
      else if (n.label.length > 32) problems.push(`node ${n.id}: label longer than 32 characters`)
      if (!str(n?.icon)) problems.push(`node ${n?.id ?? i + 1}: missing icon`)
      if (!Number.isInteger(n?.col) || n.col < 0 || n.col > 3) problems.push(`node ${n?.id ?? i + 1}: col must be 0–3`)
      if (str(n?.id)) {
        if (n.id in col) problems.push(`duplicate node id ${n.id}`)
        col[n.id] = n.col
      }
    })
    const cols = nodes.map((n) => n.col).filter(Number.isInteger)
    const last = Math.max(...cols)
    if (last < 1) problems.push('needs at least 2 columns')
    for (let c = 0; c <= last; c++) {
      const count = cols.filter((x) => x === c).length
      if (!count) problems.push(`column ${c} is empty`)
      if (count > 4) problems.push(`column ${c} has more than 4 nodes`)
    }

    const answer = round?.answer
    if (!Array.isArray(answer) || answer.length < 2) return [...problems, 'answer needs at least 2 wires']
    const seen = new Set()
    for (const edge of answer) {
      if (!Array.isArray(edge) || edge.length !== 2 || !edge.every(str)) {
        problems.push('wires must be [fromId, toId]')
        continue
      }
      const [a, b] = edge
      if (!(a in col)) problems.push(`wire ${a} → ${b}: unknown node ${a}`)
      if (!(b in col)) problems.push(`wire ${a} → ${b}: unknown node ${b}`)
      if (a === b) problems.push(`wire ${a} → ${b}: self-loop`)
      else if (a in col && b in col && !(col[a] < col[b])) problems.push(`wire ${a} → ${b}: must go from an earlier column to a later one`)
      if (seen.has(`${a}>${b}`)) problems.push(`wire ${a} → ${b}: duplicate`)
      seen.add(`${a}>${b}`)
    }
    const wired = new Set(answer.flat())
    if (!nodes.some((n) => !wired.has(n.id))) problems.push('needs at least one decoy node (in no wire)')
    return problems
  },
}
