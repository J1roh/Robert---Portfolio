// Run: node --test supabase/functions/notify-enquiry/email.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enquiryEmail } from './email.ts'

const record = {
  name: 'Aki <b>Tanaka</b>',
  email: 'aki+work@example.com',
  company: '',
  timeline: 'Next month',
  message: 'Line one\nLine <two>',
  created_at: '2026-10-12T03:00:00Z',
}

test('fields are HTML-escaped', () => {
  const { html } = enquiryEmail(record, 'https://example.com')
  assert.ok(html.includes('Aki &lt;b&gt;Tanaka&lt;/b&gt;'))
  assert.ok(!html.includes('<b>Tanaka</b>'))
  assert.ok(html.includes('Line &lt;two&gt;'))
})

test('message line breaks are kept', () => {
  assert.ok(enquiryEmail(record, 'https://example.com').html.includes('Line one<br>Line'))
})

test('reply link is encoded and CMS link points at the inbox', () => {
  const { html } = enquiryEmail(record, 'https://example.com/')
  assert.ok(html.includes('mailto:aki%2Bwork%40example.com?subject=Re%3A'))
  assert.ok(html.includes('https://example.com/#/cms/enquiries'))
})

test('blank optional fields are left out; filled ones shown', () => {
  const { html, text } = enquiryEmail(record, 'https://example.com')
  assert.ok(!html.includes('>Company<'))
  assert.ok(html.includes('>Timeline<'))
  assert.ok(text.includes('Timeline: Next month'))
  assert.ok(!text.includes('Company:'))
})

test('no site URL yet: CMS links are left out, reply still there', () => {
  const { html, text } = enquiryEmail(record, '')
  assert.ok(!html.includes('cms/enquiries'))
  assert.ok(!html.includes('Open in CMS'))
  assert.ok(!text.includes('Open in CMS'))
  assert.ok(html.includes('Reply to'))
})

test('subject names the sender; time shown in JST', () => {
  const { subject, text } = enquiryEmail(record, 'https://example.com')
  assert.equal(subject, 'New enquiry from Aki <b>Tanaka</b>')
  assert.ok(text.includes('12:00 JST'))
})
