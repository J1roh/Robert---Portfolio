import { useEffect, useRef } from 'react'
import ScrambleText from '../../components/ScrambleText.tsx'
import Arrow from '../../components/Arrow.tsx'
import RollingNumber from '../../components/RollingNumber.tsx'
import HeroArt from './HeroArt.tsx'
import { site, type Copy, type Language } from '../../lib/content.ts'
import './hero.css'

// How long the parallax layers take to catch up with the scroll; larger = more trailing on fast scrolls.
const CATCH_UP_MS = 180

// Sets --hero-progress (0 at the top, 1 after one screen) on the hero, eased toward the real scroll
// position so fast scrolls still show the layers trailing and settling. CSS in hero.css does the moving.
function useHeroParallax() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let shown = Math.min(scrollY, innerHeight)
    let frame = 0
    let last = 0
    const paint = () => ref.current?.style.setProperty('--hero-progress', String(shown / innerHeight))
    const tick = (now: number) => {
      const target = Math.min(scrollY, innerHeight)
      shown += (target - shown) * (1 - Math.exp(-Math.max(0, now - last) / CATCH_UP_MS))
      if (Math.abs(target - shown) < 0.5) shown = target
      last = now
      paint()
      frame = shown === target ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    paint()
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

export default function Hero({ copy, language }: { copy: Copy; language: Language }) {
  const [first, last] = language === 'ja' ? site.nameLinesJa : site.nameLines
  // Two lines like the old name treatment, split after the arrow or 、 ("Japanese →" / "English Translator").
  const [lead, tail] = copy.intro.match(/^(.*?[→、])\s*(.+)$/)?.slice(1) ?? [copy.intro, '']
  const ref = useHeroParallax()

  return (
    <section ref={ref} className="hero" id="top" aria-labelledby="hero-heading">
      <HeroArt />
      <p className="availability">
        <span aria-hidden="true" />
        {copy.availability}
      </p>
      <p className="kicker">{copy.eyebrow}</p>
      {/* Service first, name second (designer review): the headline is what the client is hiring. */}
      <h1 id="hero-heading" className="hero-headline">
        <span><ScrambleText text={lead} /></span> {tail && <em><ScrambleText text={tail} /></em>}
      </h1>
      <p className="hero-name">
        <ScrambleText text={first} trigger={language} /> <ScrambleText text={last} trigger={language} />
      </p>
      <div className="hero-bottom">
        <div className="hero-message">
          <dl className="hero-stats">
            {copy.stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd><RollingNumber value={stat.value} /></dd>
              </div>
            ))}
          </dl>
          <p className="hero-client-roster">{copy.clientRoster}</p>
        </div>
        <a className="circle-link" href="#work">
          <span>{copy.viewWork}</span>
          <Arrow down />
        </a>
      </div>
      <p className="scroll-note" aria-hidden="true">
        {copy.scroll} <span>↓</span>
      </p>
    </section>
  )
}
