import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Landing from './pages/Landing.tsx'
// Loaded on demand: only visitors who open these pages download them (keeps the landing page's first paint fast).
const Login = lazy(() => import('./pages/Login.tsx'))
const Cms = lazy(() => import('./pages/Cms.tsx'))
import Loader from './features/loader/Loader.tsx'
import SiteHeader from './features/site-header/SiteHeader.tsx'
import SiteFooter from './features/site-footer/SiteFooter.tsx'
import { site, defaults, loadContent, type Language } from './lib/content.ts'
import { useStoredChoice } from './lib/use-stored-choice.ts'

// shortcut: hash routes work on any static host without rewrites; switch to react-router if pages/params grow.
// Route hashes start with "#/"; plain hashes ("#work", "#main") are in-page anchors.
const LOGIN = '#/login'
const CMS = '#/cms'
const CMS_ENQUIRIES = '#/cms/enquiries'
const pageRoute = (hash: string) => ([LOGIN, CMS, CMS_ENQUIRIES].includes(hash) ? hash : null)
// The contact form moved from its own page (#/contact) into the landing page's Contact section; old links land there.
const redirectOldContact = () => {
  // A real hash navigation (not history.replaceState), so the browser keeps scrolling to it while the page loads.
  if (location.hash === '#/contact') location.replace('#contact')
}
redirectOldContact()

function routeFor(hash: string, current: string) {
  const page = pageRoute(hash)
  if (page) return page
  // An anchor on the current page just scrolls; one that isn't here belongs to the landing page.
  if (!hash.startsWith('#/') && document.getElementById(hash.slice(1))) return current
  return '#/'
}

export default function App() {
  const [route, setRoute] = useState(() => pageRoute(location.hash) ?? '#/')
  const [language, setLanguage] = useStoredChoice(
    'language',
    Object.keys(site.copy) as Language[],
    () => (navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'),
  )
  const lang = language ?? 'en'
  const [content, setContent] = useState(defaults)
  // Memoized: ScrambleText re-animates whenever the copy object's identity changes.
  const copy = useMemo(() => ({ ...site.copy[lang], stats: content.stats[lang], clientRoster: content.clientRoster[lang] }),[lang, content])
  const mainRef = useRef<HTMLElement>(null)
  const shownRoute = useRef(route)

  useEffect(() => {
    loadContent().then(setContent)
  }, [])

  useEffect(() => {
    const onHash = () => {
      redirectOldContact()
      setRoute((current) => routeFor(location.hash, current))
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = route === LOGIN ? `${site.login.heading} — ${site.name}` : route === CMS ? `CMS — ${site.name}` : route === CMS_ENQUIRIES ? `Enquiries — CMS — ${site.name}` : site.pageTitle
    // Deep links (or nav clicks from another page) to a section scroll there once the page renders.
    const target = location.hash.startsWith('#/') ? null : document.getElementById(location.hash.slice(1))
    if (target) target.scrollIntoView({ behavior: 'instant' })
    if (shownRoute.current === route) return
    shownRoute.current = route
    if (!target) scrollTo({ top: 0, behavior: 'instant' })
    // Tell keyboard and screen-reader users the page changed.
    mainRef.current?.focus({ preventScroll: true })
  }, [route])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Rendered by React (not index.html) so it never shows unstyled before the CSS loads.
  const skipLink = <a className="skip-link" href="#main">Skip to main content</a>

  // The CMS is a full-screen app of its own, like the owner's design: no site header, footer or loader.
  if (route === CMS || route === CMS_ENQUIRIES) {
    return (
      <>
        {skipLink}
        <Suspense fallback={null}>
          <Cms content={content} onSaved={setContent} page={route === CMS ? 'content' : 'enquiries'} />
        </Suspense>
      </>
    )
  }

  return (
    <>
      {skipLink}
      <Loader />
      <SiteHeader copy={copy} language={lang} onLanguage={setLanguage} />
      <main id="main" tabIndex={-1} ref={mainRef}>
        {route === LOGIN ? (
          <Suspense fallback={null}>
            <Login />
          </Suspense>
        ) : (
          <Landing copy={copy} language={lang} content={content} />
        )}
      </main>
      <SiteFooter copy={copy} links={content.links} />
    </>
  )
}
