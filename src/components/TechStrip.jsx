import { useContent, useLang } from '../i18n.jsx'

// One slow, endless line of skills; the list is rendered twice so the loop is seamless.
export default function TechStrip() {
  const { t } = useLang()
  const { technologies } = useContent()
  return (
    <section className="strip" aria-label={t('tech.label')}>
      <div className="marquee">
        <div className="marquee-track">
          {[...technologies, ...technologies].map((tech, i) => (
            <span className="tech" key={i} aria-hidden={i >= technologies.length || undefined}>{tech}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
