// Log detective: read a Salesforce debug log, pin the clue lines as evidence, accuse the culprit.
// Round: { q, log: multi-line string, clues: [1–3 line indexes, 0-based], suspects: [3–4 strings], answer: index, why }

// "14:02:11.042 (42417593)|" at the start of a log entry.
export const STAMP = /^(\d{2}:\d{2}:\d{2}\.\d{1,3})\s*(\(\d+\))?\|/

// Two lines are the same piece of evidence when they match apart from the timestamp
// (the same query repeated in a loop, for example).
export const entryKey = (line) => line.replace(STAMP, '').trim()

const str = (v) => typeof v === 'string' && v.trim().length > 0

export default {
  label: 'Log detective',
  icon: '🕵️',
  rounds: [3, 6],
  checkRound(round) {
    const errors = []
    if (!str(round?.q)) errors.push('missing q')
    if (!str(round?.log)) return [...errors, 'missing log']

    const lines = round.log.split('\n')
    if (lines.length < 15 || lines.length > 35) errors.push(`log needs 15–35 lines (has ${lines.length})`)
    if (!lines.some((l) => STAMP.test(l))) errors.push('log has no timestamped entries')

    const { clues } = round
    if (!Array.isArray(clues) || clues.length < 1 || clues.length > 3) errors.push('needs 1–3 clues')
    else if (!clues.every((c) => Number.isInteger(c) && c >= 0 && c < lines.length)) errors.push(`clue line out of range (log has ${lines.length} lines)`)
    else {
      if (new Set(clues).size !== clues.length) errors.push('clues must be unique')
      if (clues.some((c) => !lines[c].trim())) errors.push('a clue points at a blank line')
      if (new Set(clues.map((c) => entryKey(lines[c]))).size !== clues.length) errors.push('two clues are the same log entry')
    }

    const { suspects } = round
    if (!Array.isArray(suspects) || suspects.length < 3 || suspects.length > 4 || !suspects.every(str)) errors.push('needs 3–4 suspects')
    else {
      if (new Set(suspects).size !== suspects.length) errors.push('suspects must be unique')
      if (!Number.isInteger(round.answer) || round.answer < 0 || round.answer >= suspects.length) errors.push('answer out of range')
    }
    return errors
  },
}
