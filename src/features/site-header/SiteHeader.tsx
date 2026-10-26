import { useEffect, useState } from 'react'
import { site, type Copy, type Language } from '../../lib/content.ts'
import './site-header.css'

type Props = {
  copy: Copy
  language: Language
  onLanguage: (language: Language) => void
}

const languages: { code: Language; label: string }[] = [
  { code: 'ja', label: 'JP' },
  { code: 'en', label: 'EN' },
]

export default function SiteHeader({ copy, language, onLanguage }: Props) {
  const [hidden, setHidden] = useState(false)

  // After motion.dev's scroll-hide-header: hides on scroll down past 150px, returns on any scroll up.
  useEffect(() => {
    let last = scrollY
    const onScroll = () => {
      setHidden(scrollY > last && scrollY > 150)
      last = scrollY
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={hidden ? 'site-header is-hidden' : 'site-header'}>
      <a className="brand" href="#top" aria-label={`${site.brand} — ${site.name}, home`}>
        {site.brand}<span aria-hidden="true">®</span>
      </a>
      <nav className="site-nav" aria-label="Main">
        <a href="#work">{copy.navWork}</a>
        <a href="#about">{copy.navAbout}</a>
        <a href="#contact">{copy.navContact}</a>
      </nav>
      <div className="header-actions">
        <div className="language-switch" role="group" aria-label={copy.languageLabel}>
          {languages.map(({ code, label }, i) => (
            <span key={code}>
              {i > 0 && <span aria-hidden="true">/ </span>}
              <button type="button" lang={code} aria-pressed={language === code} onClick={() => onLanguage(code)}>
                {label}
              </button>
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
