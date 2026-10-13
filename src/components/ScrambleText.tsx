import { useEffect, useRef, useState, type ReactNode } from 'react'
import { scrambleDuration, scrambleFrame } from '../lib/scramble.ts'
import './scramble-text.css'

type Props = {
  text: string
  // Scrambles again whenever this changes, even if `text` stays the same (e.g. the name on a language switch).
  trigger?: unknown
  // Shown instead of `text` once settled, e.g. the same text with animated numbers.
  children?: ReactNode
}

// In-house take on Motion+ ScrambleText (https://motion.dev/examples/react-scramble-text); avoids a paid dependency.
export default function ScrambleText({ text, trigger, children }: Props) {
  const [frame, setFrame] = useState<string | null>(null)
  const last = useRef({ text, trigger })

  useEffect(() => {
    if (last.current.text === text && last.current.trigger === trigger) return
    last.current = { text, trigger }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = performance.now()
    const end = scrambleDuration(text)
    let id = 0
    const tick = (now: number) => {
      const elapsed = now - start
      setFrame(elapsed < end ? scrambleFrame(text, elapsed) : null)
      if (elapsed < end) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(id)
      setFrame(null)
    }
  }, [text, trigger])

  if (frame === null) return children ?? text
  // The real text stays in place (invisible) so line breaks and height never change; glyphs are drawn over it.
  // Screen readers read the real text, not the random glyphs.
  return (
    <span className="scramble">
      <span className="scramble-ghost">{text}</span>
      <span className="scramble-frame" aria-hidden="true">{frame}</span>
    </span>
  )
}
