import { useLang } from '../i18n.jsx'

// Shared with the Arcade, which has no LangProvider: useLang() then falls back to English.
export default function Footer({ clock }) {
  const { t } = useLang()
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} Syntacks · {t('footer.place')}</p>
        <p className="footer-clock" title={t('footer.clockTitle')}>
          {t('footer.city')} {clock.time} · {t('footer.phase')[clock.phase]}
        </p>
        <p className="fine">{t('footer.trademark')}</p>
      </div>
    </footer>
  )
}
