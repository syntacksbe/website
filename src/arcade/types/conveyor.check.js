// Deploy conveyor: metadata crates ride a belt into Production; a crate whose dependencies haven't
// shipped yet explodes. Round shape:
//   { q, items: [{ name, kind, needs: [names of earlier items] }] (4–7, listed in a valid deploy order),
//     time: seconds (20–45), why }
// Any order that ships every crate after the crates it needs scores full marks.
const str = (v) => typeof v === 'string' && v.trim().length > 0

export default {
  label: 'Deploy conveyor',
  icon: '🏭',
  rounds: [3, 6],
  checkRound(round) {
    const problems = []
    if (!str(round.q)) problems.push('missing q')
    if (!Number.isInteger(round.time) || round.time < 20 || round.time > 45) problems.push('time must be a whole number of seconds, 20–45')
    const items = round.items
    if (!Array.isArray(items) || items.length < 4 || items.length > 7) return [...problems, 'needs 4–7 items']
    const earlier = new Set()
    items.forEach((item, i) => {
      const at = `item ${i + 1}`
      if (!str(item?.name)) return problems.push(`${at}: missing name`)
      if (!str(item.kind)) problems.push(`${at}: missing kind`)
      if (earlier.has(item.name)) problems.push(`${at}: duplicate name ${item.name}`)
      const needs = item.needs ?? []
      if (!Array.isArray(needs) || !needs.every(str)) problems.push(`${at}: needs must be a list of names`)
      else {
        if (new Set(needs).size !== needs.length) problems.push(`${at}: duplicate entry in needs`)
        for (const n of needs) if (!earlier.has(n)) problems.push(`${at}: needs "${n}", which is not an earlier item`)
      }
      earlier.add(item.name)
    })
    return problems
  },
}
