// Run: node --test worker/session.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkPassword, hashPassword, samePassword, signSession, verifySession } from './session.ts'

test('a signed session carries the user and version, and verifies until it expires', async () => {
  const token = await signSession('secret', 'u1', 3, 2000)
  assert.deepEqual(await verifySession('secret', token, 1000), { userId: 'u1', ver: 3 })
  assert.equal(await verifySession('secret', token, 3000), null)
})

test('tampered, foreign or missing tokens are refused', async () => {
  const token = await signSession('secret', 'u1', 0, 2000)
  assert.equal(await verifySession('other', token, 1000), null)
  assert.equal(await verifySession('secret', token.replace(/^u1/, 'u2'), 1000), null)
  assert.equal(await verifySession('secret', token.replace('.0.', '.1.'), 1000), null)
  assert.equal(await verifySession('secret', token.replace('.2000.', '.9000.'), 1000), null)
  assert.equal(await verifySession('secret', 'junk', 1000), null)
  assert.equal(await verifySession('secret', undefined, 1000), null)
})

test('stored passwords: right one passes, wrong one and junk fail, salts differ', async () => {
  const stored = await hashPassword('correct horse battery')
  assert.match(stored, /^pbkdf2\$100000\$/)
  assert.equal(await checkPassword('correct horse battery', stored), true)
  assert.equal(await checkPassword('correct horse batterY', stored), false)
  assert.equal(await checkPassword('correct horse battery', 'junk'), false)
  assert.notEqual(await hashPassword('correct horse battery'), stored)
})

test('first sign-in password check', async () => {
  assert.equal(await samePassword('hunter2', 'hunter2'), true)
  assert.equal(await samePassword('hunter3', 'hunter2'), false)
  assert.equal(await samePassword('', ''), false)
})
