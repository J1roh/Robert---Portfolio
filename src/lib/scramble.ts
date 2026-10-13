// Katakana + Latin so the scramble reads as "between Japanese and English".
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const SCRAMBLE_HOLD_MS = 150
const STEP_MS = 30
const MAX_REVEAL_MS = 600

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

// Time between one character settling and the next, capped so long lines still finish quickly.
export const scrambleStep = (text: string) => Math.min(STEP_MS, MAX_REVEAL_MS / Math.max(text.length, 1))

export const scrambleDuration = (text: string) => SCRAMBLE_HOLD_MS + [...text].length * scrambleStep(text)

// Characters settle left to right; spaces and line breaks stay put so word shapes are visible while scrambling.
export function scrambleFrame(text: string, elapsed: number, random = randomGlyph) {
  const step = scrambleStep(text)
  return [...text]
    .map((char, i) => (/\s/.test(char) || elapsed >= SCRAMBLE_HOLD_MS + (i + 1) * step ? char : random()))
    .join('')
}
