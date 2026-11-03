import { Fragment } from 'react'

// Splits text into word spans (with an index in --i) so the words can animate in one after another.
export default function Words({ text, start = 0, className = '' }) {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className={`w ${className}`.trim()} style={{ '--i': start + i }}>{word}</span>
    </Fragment>
  ))
}
