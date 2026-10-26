import { useEffect, useState } from 'react'
import ScrambleText from '../../components/ScrambleText.tsx'
import { scrambleDuration } from '../../lib/scramble.ts'
import './loader.css'

// Set to true to show the opening animation again.
const ENABLED = false

const FROM = 'アニメ'
const TO = 'ANIME'
const SHOW_MS = 450 // how long the Japanese reads before it scrambles
const PAUSE_MS = 500 // how long the English reads before the overlay fades
const FADE_MS = 250 // covers the .loader opacity transition (--transition-fast)

// Opening overlay: アニメ scrambles into ANIME, then fades away. Decorative, so hidden from screen readers.
export default function Loader() {
  const [phase, setPhase] = useState<'from' | 'to' | 'done' | 'gone'>(() =>
    !ENABLED || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'gone' : 'from',
  )

  useEffect(() => {
    if (phase === 'gone') return
    const wait = { from: SHOW_MS, to: scrambleDuration(TO) + PAUSE_MS, done: FADE_MS }[phase]
    const next = ({ from: 'to', to: 'done', done: 'gone' } as const)[phase]
    const id = setTimeout(() => setPhase(next), wait)
    return () => clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null
  return (
    <div className={phase === 'done' ? 'loader is-done' : 'loader'} aria-hidden="true">
      <p className="loader-word" lang={phase === 'from' ? 'ja' : 'en'}>
        <ScrambleText text={phase === 'from' ? FROM : TO} />
      </p>
      <p className="kicker">日本語 → ENGLISH</p>
    </div>
  )
}
