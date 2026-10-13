// Run: node --test src/lib/poster-key.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { posterKey } from './poster-key.ts'

test('plain title slugifies', () => assert.equal(posterKey('Re:Zero S3 & S4'), 're-zero-s3-s4'))
test('drops a (…) credit note', () => assert.equal(posterKey('Wind Breaker S2 (except opening/ending songs)'), 'wind-breaker-s2'))
test('drops a — credit note', () => assert.equal(posterKey('Return to Zeroes — Translator, PM (TABINOMICHI)'), 'return-to-zeroes'))
test('cuts at the first (', () => assert.equal(posterKey('Devil May Cry (2025) (Netflix, via ZOO Digital)'), 'devil-may-cry'))
