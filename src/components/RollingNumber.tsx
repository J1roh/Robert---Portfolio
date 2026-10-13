import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './rolling-number.css'

// Two rounds of 0–9: every digit spins one full turn before landing, so zeros move too.
const DIGITS = [...'01234567890123456789']

// In-house take on Motion+ AnimateNumber (https://motion.dev/examples/vue-number-trend); avoids a paid dependency.
// Each digit spins up from 0, one full turn, to its value the first time the number scrolls into view; commas and "+" stay put.
export default function RollingNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      // Already on screen at load (e.g. the hero after a refresh): wait until the 0s have been painted,
      // otherwise the browser never sees a starting point and the digits jump straight to their value.
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setShown(true))))
    })
    observer.observe(ref.current!)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  // Screen readers get the plain value; the rolling columns are hidden from them.
  return (
    <span ref={ref} className="rolling-number">
      <span className="rolling-text">{value}</span>
      <span aria-hidden="true">
        {[...value].map((char, i) =>
          /\d/.test(char) ? (
            <span key={i} className="rolling-digit">
              <span style={{ '--n': shown ? 10 + Number(char) : 0, '--i': i } as CSSProperties}>
                {DIGITS.map((d, j) => <span key={j}>{d}</span>)}
              </span>
            </span>
          ) : (
            char
          ),
        )}
      </span>
    </span>
  )
}
