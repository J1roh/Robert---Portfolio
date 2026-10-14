// Run: node --test src/lib/merge-content.test.ts  (Node 24 runs TypeScript directly; no test framework needed)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeContent } from './merge-content.ts'

const defaults = {
  projects: [{ slug: 'a' }],
  stats: { en: [{ value: '1', label: 'x' }], ja: [{ value: '1', label: 'y' }] },
  clientRoster: { en: 'A · B', ja: 'A・B' },
  links: { linkedin: 'L', x: 'X', xLabel: 'XL' },
}

test('empty or non-object saved value returns defaults', () => {
  assert.deepEqual(mergeContent(null, defaults), defaults)
  assert.deepEqual(mergeContent('nope', defaults), defaults)
  assert.deepEqual(mergeContent([], defaults), defaults)
})

test('partial override keeps the rest', () => {
  const out = mergeContent({ stats: { en: [{ value: '2', label: 'z' }] }, links: { x: 'NEWX' } }, defaults)
  assert.deepEqual(out.projects, defaults.projects)
  assert.deepEqual(out.stats.en, [{ value: '2', label: 'x' }])
  assert.deepEqual(out.stats.ja, defaults.stats.ja)
  assert.deepEqual(out.links, { linkedin: 'L', x: 'NEWX', xLabel: 'XL' })
})

test('stats added to defaults survive an older saved row', () => {
  const two = { ...defaults, stats: { en: [{ value: '1', label: 'x' }, { value: '7+', label: 'new' }], ja: defaults.stats.ja } }
  const out = mergeContent({ stats: { en: [{ value: '2', label: 'x' }] } }, two)
  assert.deepEqual(out.stats.en, [{ value: '2', label: 'x' }, { value: '7+', label: 'new' }])
})

test('saved client roster overrides the default per language', () => {
  assert.deepEqual(mergeContent({ clientRoster: { en: 'C · D', ja: 3 } }, defaults).clientRoster, { en: 'C · D', ja: 'A・B' })
})

test('an older single-string roster applies to both languages', () => {
  assert.deepEqual(mergeContent({ clientRoster: 'C · D' }, defaults).clientRoster, { en: 'C · D', ja: 'C · D' })
})

test('saved projects keep new default fields, matched by slug', () => {
  const withList = { ...defaults, projects: [{ slug: 'a', title: 'A', allTitles: ['x'] }] }
  const out = mergeContent({ projects: [{ slug: 'a', title: 'Edited' }, { slug: 'new', title: 'N' }] }, withList)
  assert.deepEqual(out.projects, [{ slug: 'a', title: 'Edited', allTitles: ['x'] }, { slug: 'new', title: 'N' }])
})

test('a category saved with only `works` (before allTitles) keeps its list', () => {
  const out = mergeContent({ projects: [{ slug: 'custom', works: ['w'], allTitles: [] }] }, defaults)
  assert.deepEqual(out.projects, [{ slug: 'custom', works: ['w'], allTitles: ['w'] }])
})

test('wrong types fall back per field', () => {
  const out = mergeContent({ projects: 'bad', stats: [], clientRoster: 3, links: 5 }, defaults)
  assert.deepEqual(out, defaults)
})
