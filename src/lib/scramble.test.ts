// Run: node --test src/lib/scramble.test.ts  (Node 24 runs TypeScript directly; no test framework needed)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scrambleDuration, scrambleFrame } from './scramble.ts'

const text = 'Stories, translated to travel.'

test('ends on the exact target text', () => {
  assert.equal(scrambleFrame(text, scrambleDuration(text)), text)
})

test('starts fully scrambled except spaces', () => {
  const frame = scrambleFrame(text, 0, () => '#')
  assert.equal(frame, text.replace(/[^ ]/g, '#'))
})

test('settles left to right', () => {
  const half = scrambleFrame(text, scrambleDuration(text) / 2 + 75, () => '#')
  assert.ok(half.startsWith('Stor'))
  assert.ok(half.endsWith('#'))
})

test('handles Japanese text and empty strings', () => {
  const ja = '物語を、世界へ。'
  assert.equal(scrambleFrame(ja, scrambleDuration(ja)), ja)
  assert.equal(scrambleFrame('', 0), '')
})
