import { Fragment } from 'react'

// Tiny Apex / LWC syntax highlighter: comments, strings, keywords and Capitalised types.
const TOKEN =
  /(\/\/.*)|('[^']*'?|`[^`]*`?)|\b(trigger|on|before|after|insert|update|for|new|if|public|void|static|class|with|sharing|implements|return|import|from|export|default|extends|const|SELECT|FROM|WHERE|IN)\b|(@\w+)|\b([A-Z]\w*)\b/g

export function highlight(code) {
  const out = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] || m[4] ? 'k' : 't'
    out.push(<span key={m.index} className={cls}>{m[0]}</span>)
    last = m.index + m[0].length
  }
  out.push(code.slice(last))
  return out
}

// Declarative config (Flows, validation rules) written as "Label   value" lines:
// tree guides are dimmed, labels coloured, quoted values and {!merge} fields highlighted.
const CONFIG_LINE = /^([\s│├└─→]*)(\S.*?)( {2,})(.*)$/
const CONFIG_VALUE = /('[^']*'?|\{![^}]*\}?)/g

function values(text, key) {
  return text.split(CONFIG_VALUE).map((part, i) =>
    i % 2 ? <span key={`${key}-${i}`} className="s">{part}</span> : part,
  )
}

export function highlightConfig(code) {
  return code.split('\n').map((line, i) => {
    const m = line.match(CONFIG_LINE)
    return (
      <Fragment key={i}>
        {i > 0 && '\n'}
        {m ? (
          <>
            <span className="c">{m[1]}</span>
            <span className="k">{m[2]}</span>
            {m[3]}
            {values(m[4], i)}
          </>
        ) : (
          values(line, i)
        )}
      </Fragment>
    )
  })
}
