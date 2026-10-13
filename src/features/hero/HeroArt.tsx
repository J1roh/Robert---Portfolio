import { useEffect, useState, type CSSProperties } from 'react'
import { site } from '../../lib/content.ts'
import { initialWall, nextWall } from '../../lib/poster-wall.ts'
import './hero-art.css'

// Every image under assets/hero is bundled; content/site.json picks which ones show, in order.
const files = import.meta.glob<string>('../../../assets/hero/**/*.{png,jpg,jpeg,webp,avif}', { eager: true, import: 'default' })

function resolve(file: string) {
  const src = files[`../../../assets/hero/${file}`]
  if (!src) throw new Error(`content/site.json heroArt: "assets/hero/${file}" does not exist`)
  return src
}

// A slide is either one image or a wall of portrait posters. An image's "focus" (CSS object-position, e.g.
// "38% 30%") is the point kept in frame when a portrait screen crops it: the character, not empty background.
const slides = site.heroArt.map((slide) =>
  slide.posters ? { posters: slide.posters.map(resolve) } : { image: resolve(slide.file), focus: slide.focus ?? '50% 50%' },
)

const SLIDE_MS = 8000
const SWAP_MS = 3500
const WALL_TILES = 4
// Head start for the first slide's paint on slow phones; well under SLIDE_MS, so the next slide is loaded in time.
const READY_DELAY_MS = 2000
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Decorative crossfading key art. Single images of any shape are shown whole over a blurred copy of themselves.
export default function HeroArt() {
  const [active, setActive] = useState(0)
  // The other slides' images wait for the first one, so they don't compete with it for bandwidth (LCP).
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || reducedMotion()) return
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hero-art" aria-hidden="true">
      {slides.map((slide, i) => (
        <div key={i} className={i === active ? 'hero-slide is-active' : 'hero-slide'}>
          {i > 0 && !ready ? null : slide.posters ? (
            <PosterWall posters={slide.posters} active={i === active} />
          ) : (
            <>
              <img className="hero-slide-fill" src={slide.image} alt="" />
              <img
                className="hero-slide-image"
                src={slide.image}
                alt=""
                fetchPriority={i === 0 ? 'high' : 'low'}
                onLoad={i === 0 ? () => setTimeout(() => setReady(true), READY_DELAY_MS) : undefined}
                style={{ '--focus': slide.focus } as CSSProperties}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// Up to 4 posters side by side; with more, one tile at a time swaps in a poster that isn't shown.
function PosterWall({ posters, active }: { posters: string[]; active: boolean }) {
  const [shown, setShown] = useState(() => initialWall(posters.length, WALL_TILES))

  useEffect(() => {
    if (!active || posters.length <= WALL_TILES || reducedMotion()) return
    let step = 0
    const id = setInterval(() => {
      const current = step++ // outside the updater: StrictMode may call updaters twice
      setShown((wall) => nextWall(wall, posters.length, current))
    }, SWAP_MS)
    return () => clearInterval(id)
  }, [active, posters.length])

  return (
    <div className="hero-wall">
      {shown.map((poster, tile) => (
        // Keyed by poster so a swapped tile remounts and fades in.
        <img key={`${tile}-${poster}`} className="hero-wall-poster" src={posters[poster]} alt="" />
      ))}
    </div>
  )
}
