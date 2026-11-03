import Words from './Words.jsx'

export default function SectionHead({ kicker, title, children }) {
  return (
    <div className="section-head reveal">
      <p className="kicker">{kicker}</p>
      <h2><Words text={title} /></h2>
      {children && <p className="section-sub">{children}</p>}
    </div>
  )
}
