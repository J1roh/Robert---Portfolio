// Run: node --test src/lib/poster-wall.test.ts  (Node 24 runs TypeScript directly; no test framework needed)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialWall, nextWall } from './poster-wall.ts'

const run = (poolSize: number, steps: number) => {
  let wall = initialWall(poolSize, 4)
  const history = [wall]
  for (let step = 0; step < steps; step++) history.push((wall = nextWall(wall, poolSize, step)))
  return history
}

test('fewer posters than tiles fills only what exists', () => {
  assert.deepEqual(initialWall(3, 4), [0, 1, 2])
})

test('exactly 4 (or fewer) posters never swap', () => {
  for (const wall of run(4, 10)) assert.deepEqual(wall, [0, 1, 2, 3])
  for (const wall of run(2, 10)) assert.deepEqual(wall, [0, 1])
})

for (const poolSize of [5, 6, 7, 9]) {
  test(`${poolSize} posters: every poster appears and none repeats on the wall`, () => {
    const history = run(poolSize, poolSize * 8)
    const seen = new Set(history.flat())
    assert.equal(seen.size, poolSize)
    for (const wall of history) assert.equal(new Set(wall).size, wall.length)
  })
}

test('each step changes exactly one tile', () => {
  const history = run(6, 12)
  for (let i = 1; i < history.length; i++) {
    const changed = history[i].filter((poster, tile) => poster !== history[i - 1][tile])
    assert.equal(changed.length, 1)
  }
})
