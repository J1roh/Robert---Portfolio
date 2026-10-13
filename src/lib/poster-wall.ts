// Which posters fill the wall's tiles. `shown[tile]` is an index into the poster pool.
export const initialWall = (poolSize: number, tiles: number) =>
  Array.from({ length: Math.min(poolSize, tiles) }, (_, i) => i)

// Each step, one tile (round-robin) swaps to the next poster that isn't already on the wall.
// With no more posters than tiles there is nothing to swap in, so the wall stays as is.
export function nextWall(shown: number[], poolSize: number, step: number): number[] {
  if (poolSize <= shown.length) return shown
  const tile = step % shown.length
  let candidate = shown[tile]
  do candidate = (candidate + 1) % poolSize
  while (shown.includes(candidate))
  return shown.map((poster, i) => (i === tile ? candidate : poster))
}
