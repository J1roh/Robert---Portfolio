// Run: node --test src/lib/enquiry-date.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatEnquiryDate } from './enquiry-date.ts'

const now = new Date(2026, 9, 11, 15, 0) // 11 Oct 2026, 15:00 local
const at = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m, d, h, min).toISOString()

test('today and yesterday by calendar day, not 24h', () => {
  assert.equal(formatEnquiryDate(at(2026, 9, 11, 9, 42), now), 'Today · 09:42')
  assert.equal(formatEnquiryDate(at(2026, 9, 10, 23, 59), now), 'Yesterday · 23:59')
})

test('older dates show day and month, plus the year when it differs', () => {
  // Month abbreviation varies by ICU version ("Sep" / "Sept"), so match any word.
  assert.match(formatEnquiryDate(at(2026, 8, 18, 11, 3), now), /^18 \w+ · 11:03$/)
  assert.match(formatEnquiryDate(at(2025, 8, 18, 11, 3), now), /^18 \w+ 2025 · 11:03$/)
})
