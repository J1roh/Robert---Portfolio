// Run: node --test supabase/functions/submit-enquiry/checks.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canReceiveMail, cleanFields, emailDomain, isDisposable } from './checks.ts'

const ok = { name: ' Aki ', email: ' Aki@Studio.JP ', company: '', timeline: 'Soon', message: ' Hello ' }

test('fields are trimmed and the email lowercased', () => {
  assert.deepEqual(cleanFields(ok), { name: 'Aki', email: 'aki@studio.jp', company: '', timeline: 'Soon', message: 'Hello' })
})

test('missing, too long or malformed fields are refused', () => {
  assert.equal(cleanFields(null), null)
  assert.equal(cleanFields({ ...ok, name: '   ' }), null)
  assert.equal(cleanFields({ ...ok, message: 'x'.repeat(5001) }), null)
  assert.equal(cleanFields({ ...ok, email: 'not-an-email' }), null)
  assert.equal(cleanFields({ ...ok, email: 'a@b' }), null)
  // A non-text optional field is treated as blank, not as an error.
  assert.deepEqual(cleanFields({ ...ok, company: 42 }), cleanFields(ok))
})

test('domain is the part after the last @', () => {
  assert.equal(emailDomain('a@Mail.Example.com'), 'mail.example.com')
})

test('disposable domains match themselves and subdomains only', () => {
  const list = new Set(['mailinator.com'])
  assert.equal(isDisposable('mailinator.com', list), true)
  assert.equal(isDisposable('inbox.mailinator.com', list), true)
  assert.equal(isDisposable('notmailinator.com', list), false)
  assert.equal(isDisposable('gmail.com', list), false)
})

// Fake DNS-over-HTTPS: answers keyed by record type; null = network failure.
const dns = (answers: Record<string, object | null>) => async (url: string) => {
  const type = new URL(url).searchParams.get('type')!
  const body = answers[type]
  if (body === null) throw new Error('network down')
  return { ok: true, json: async () => body ?? { Status: 0 } }
}

test('MX record: can receive mail', async () => {
  assert.equal(await canReceiveMail('studio.jp', dns({ MX: { Status: 0, Answer: [{ type: 15 }] } })), true)
})

test('no MX but an A record: allowed (mail fallback)', async () => {
  assert.equal(await canReceiveMail('studio.jp', dns({ MX: { Status: 0 }, A: { Status: 0, Answer: [{ type: 1 }] } })), true)
})

test('domain does not exist: refused', async () => {
  assert.equal(await canReceiveMail('nope-zzzz.com', dns({ MX: { Status: 3 } })), false)
})

test('domain exists but has neither MX nor A: refused', async () => {
  assert.equal(await canReceiveMail('parked.com', dns({ MX: { Status: 0 }, A: { Status: 0 } })), false)
})

test('null MX ("0 ."): the domain says it never receives mail, refused', async () => {
  assert.equal(await canReceiveMail('example.com', dns({ MX: { Status: 0, Answer: [{ type: 15, data: '0 .' }] } })), false)
})

test('DNS lookup fails: allowed, never blocks a real client', async () => {
  assert.equal(await canReceiveMail('studio.jp', dns({ MX: null })), true)
})
