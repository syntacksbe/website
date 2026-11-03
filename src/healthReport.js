// PDF of the org health check: score, a "mission" stamp, the score per area, prioritised fixes and every answer.
// jsPDF is imported on demand, so it only downloads when a visitor asks for the report.
// The report follows the language the visitor picked: check texts from healthCheck(lang), the rest from strings.<lang>.js.
import { healthCheck } from './healthChecks.js'
import { LOCALES, makeT } from './strings.js'

const INK = [20, 22, 28]
const CONCRETE = [245, 242, 236]
const MUTED = [93, 88, 80]
const LINE = [221, 214, 202]
const ORANGE = [255, 90, 31]
const GOLD = [232, 154, 0]
const TEAL = [15, 123, 123]
const RED = [194, 41, 15]

const TONE = { good: TEAL, warn: GOLD, bad: RED, na: MUTED }
const SEV_COLOR = { critical: RED, high: ORANGE, medium: GOLD }
const STATUS_COLOR = { yes: TEAL, no: RED, unsure: GOLD, na: MUTED }

// The built-in PDF fonts only cover WinAnsi; swap anything outside it.
const clean = (s) => String(s).replace(/[→←]/g, '-').replace(/[^\x20-\x7E -ÿ–—‘’“”…›•]/g, '')

// Shrinks the current font until `text` fits in `maxW` mm: translated lines can run longer than the English ones.
function fit(doc, text, maxW, min = 6) {
  let size = doc.getFontSize()
  while (size > min && doc.getTextWidth(text) > maxW) {
    size -= 0.25
    doc.setFontSize(size)
  }
  return text
}

// A rectangle rotated around its centre, for the rubber stamp.
function rotatedRect(doc, cx, cy, w, h, deg) {
  const a = (deg * Math.PI) / 180
  const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [
    cx + x * Math.cos(a) - y * Math.sin(a),
    cy + x * Math.sin(a) + y * Math.cos(a),
  ])
  const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]])
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'S', true)
}

// A rounded label ending at `right`; at least `w` wide, wider when a translated label needs it. Returns its width.
function pill(doc, text, color, right, y, w = 21) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  const width = Math.max(w, doc.getTextWidth(text) + 5)
  doc.setFillColor(...color)
  doc.roundedRect(right - width, y, width, 4.8, 2.4, 2.4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(text, right - width / 2, y + 3.4, { align: 'center' })
  return width
}

export async function downloadReport({ score, grade, areas, fixes, answers, linkedin, lang = 'en' }) {
  const { jsPDF } = await import('jspdf')
  const { AREAS, SEVERITY } = healthCheck(lang)
  const t = makeT(lang)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16
  const BOTTOM = 276
  const date = clean(new Date().toLocaleDateString(LOCALES[lang] || LOCALES.en, { day: 'numeric', month: 'long', year: 'numeric' }))
  const stampColor = TONE[grade.cls]

  // Header band
  doc.setFillColor(...INK)
  doc.rect(0, 0, W, 42, 'F')
  doc.setFillColor(...ORANGE)
  doc.rect(0, 42, W * 0.6, 2.2, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(W * 0.6, 42, W * 0.4, 2.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...ORANGE)
  doc.text('SYNTACKS', M, 22)
  doc.setFontSize(11)
  doc.setTextColor(...CONCRETE)
  doc.text(clean(t('pdf.title')), M, 31)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(200, 194, 184)
  doc.text(date, W - M, 22, { align: 'right' })
  doc.text(clean(t('pdf.subtitle')), W - M, 31, { align: 'right' })

  // Later pages get a slim band instead.
  let y
  const newPage = () => {
    doc.addPage()
    doc.setFillColor(...INK)
    doc.rect(0, 0, W, 12, 'F')
    doc.setFillColor(...ORANGE)
    doc.rect(0, 12, W * 0.6, 1.2, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(W * 0.6, 12, W * 0.4, 1.2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...ORANGE)
    doc.text('SYNTACKS', M, 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(200, 194, 184)
    doc.text(clean(t('pdf.slim')) + ' · ' + date, W - M, 8, { align: 'right' })
    y = 24
  }
  const room = (h) => {
    if (y + h > BOTTOM) newPage()
  }
  const heading = (text) => {
    room(16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...INK)
    doc.text(clean(text), M, y)
    y += 6
  }

  // Score disc
  y = 56
  doc.setFillColor(...stampColor)
  doc.circle(M + 20, y + 20, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(String(score), M + 20, y + 23, { align: 'center' })
  doc.setFontSize(8.5)
  doc.text('/ 100', M + 20, y + 30, { align: 'center' })

  doc.setTextColor(...INK)
  doc.setFontSize(18)
  doc.text(clean(grade.label), M + 48, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  const gradeLines = doc.splitTextToSize(clean(grade.text), 74)
  doc.text(gradeLines, M + 48, y + 19)

  // Open fixes per severity, under the grade text
  let cx = M + 48
  const cy = y + 21 + gradeLines.length * 4.4
  Object.keys(SEVERITY).forEach((sev) => {
    const label = clean(`${fixes.filter((f) => f.severity === sev).length} ${SEVERITY[sev].label.toUpperCase()}`)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    const w = doc.getTextWidth(label) + 6
    pill(doc, label, SEV_COLOR[sev], cx + w, cy, w)
    cx += w + 2
  })

  // Rubber stamp, sized to its word and tilted like it was slammed on
  const sx = W - M - 28
  const sy = y + 16
  doc.setFont('helvetica', 'bold')
  const stamp = clean(grade.stamp)
  doc.setFontSize(stamp.length > 10 ? 13 : 16)
  const tw = doc.getTextWidth(stamp)
  doc.setDrawColor(...stampColor)
  doc.setTextColor(...stampColor)
  doc.setLineWidth(1.4)
  rotatedRect(doc, sx, sy, tw + 14, 16, -8)
  doc.setLineWidth(0.5)
  rotatedRect(doc, sx, sy, tw + 10, 12, -8)
  // jsPDF rotates text counter-clockwise around its start; offset so the word sits in the box.
  const rad = (8 * Math.PI) / 180
  doc.text(stamp, sx - (tw / 2) * Math.cos(rad) + 1.8 * Math.sin(rad), sy + (tw / 2) * Math.sin(rad) + 1.8 * Math.cos(rad), { angle: 8 })
  doc.setLineWidth(0.2)

  // Score per area
  y = 112
  heading(t('pdf.perArea'))
  areas.forEach((a) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(fit(doc, clean(a.name), 32), M, y + 4)
    doc.setFillColor(...LINE)
    doc.roundedRect(M + 34, y + 1.2, 96, 3.6, 1.8, 1.8, 'F')
    if (a.score) {
      doc.setFillColor(...TONE[a.cls])
      doc.roundedRect(M + 34, y + 1.2, Math.max(3.6, 0.96 * a.score), 3.6, 1.8, 1.8, 'F')
    }
    doc.setFontSize(11)
    doc.setTextColor(...TONE[a.cls])
    doc.text(a.score === null ? clean(t('pdf.na')) : String(a.score), M + 140, y + 4.2, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(clean(a.fixes ? t('pdf.toFix', a.fixes) : t('pdf.allClear')), W - M, y + 4, { align: 'right' })
    y += 8
  })

  // Prioritised fixes
  y += 6
  heading(fixes.length ? t('pdf.start') : t('pdf.nextSteps'))
  const list = fixes.length
    ? fixes
    : [{ id: 'keep', topic: t('pdf.keepTopic'), severity: 'medium', status: 'ok', where: ['Health Check', 'Release Updates'], fix: t('pdf.keepFix') }]
  list.forEach((f) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const body = (f.status === 'unknown' ? t('pdf.notYet') : '') + f.fix
    const lines = doc.splitTextToSize(clean(body), W - M * 2 - 8)
    const where = doc.splitTextToSize(clean(t('pdf.lookIn') + f.where.join(' · ')), W - M * 2 - 8)
    const h = 6 + lines.length * 4.4 + where.length * 3.8 + 2
    room(h + 4)
    doc.setFillColor(...(f.status === 'ok' ? TEAL : SEV_COLOR[f.severity]))
    doc.rect(M, y - 3.5, 1.6, h, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    doc.text(clean(f.topic), M + 5, y)
    if (f.status !== 'ok') {
      const statusW = pill(doc, clean(f.status === 'fail' ? t('pdf.failed') : t('pdf.notChecked')), f.status === 'fail' ? INK : MUTED, W - M, y - 3.4, 22)
      pill(doc, clean(SEVERITY[f.severity].label.toUpperCase()), SEV_COLOR[f.severity], W - M - statusW - 2, y - 3.4, 20)
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...MUTED)
    doc.text(lines, M + 5, y + 5)
    doc.setFontSize(8.5)
    doc.setTextColor(...TEAL)
    doc.text(where, M + 5, y + 5 + lines.length * 4.4)
    y += h + 4
  })

  // Every answer, grouped by area
  y += 4
  heading(t('pdf.all'))
  const statusText = t('pdf.status')
  AREAS.forEach((area) => {
    room(7 + 6.5 * 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...ORANGE)
    doc.text(clean(area.name.toUpperCase()), M, y + 3)
    y += 5
    area.checks.forEach((c, i) => {
      room(6.5)
      if (i % 2 === 0) {
        doc.setFillColor(...CONCRETE)
        doc.rect(M, y, W - M * 2, 6.5, 'F')
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...INK)
      doc.text(fit(doc, clean(c.topic), 86), M + 3, y + 4.4)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...SEV_COLOR[c.severity])
      doc.text(clean(SEVERITY[c.severity].label), M + 92, y + 4.4)
      const status = STATUS_COLOR[answers[c.id]] ? answers[c.id] : 'unsure'
      pill(doc, clean(statusText[status]), STATUS_COLOR[status], W - M - 2, y + 0.85, 18)
      y += 6.5
    })
    y += 3
  })

  // Call to action
  room(26)
  y += 2
  doc.setFillColor(...INK)
  doc.roundedRect(M, y, W - M * 2, 20, 3, 3, 'F')
  doc.setTextColor(...CONCRETE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.text(fit(doc, clean(t('pdf.ctaTitle')), W - M * 2 - 50), M + 6, y + 8.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(200, 194, 184)
  doc.text(fit(doc, clean(t('pdf.ctaText')), W - M * 2 - 50), M + 6, y + 14.5)
  doc.setFillColor(...ORANGE)
  doc.roundedRect(W - M - 40, y + 4, 34, 12, 2.5, 2.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.textWithLink('LinkedIn  >', W - M - 33.5, y + 11.5, { url: linkedin })
  doc.link(W - M - 40, y + 4, 34, 12, { url: linkedin })

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(fit(doc, clean(t('pdf.footer')), W - M * 2 - 16), M, 290)
    doc.text(`${p} / ${pages}`, W - M, 290, { align: 'right' })
  }

  doc.save(`${t('pdf.file')}-${score}.pdf`)
}
