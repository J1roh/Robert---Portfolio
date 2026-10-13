// The work's name without its credit note after " (" or " — ":
// "Wind Breaker S2 (except opening/ending songs)" → "Wind Breaker S2".
export const titleName = (title: string) => title.split(/ \(| — /)[0]

// A title's poster is assets/projects/<key>.<ext>: its name, slugified ("Wind Breaker S2" → wind-breaker-s2).
// A renamed title needs its file renamed too.
export const posterKey = (title: string) =>
  titleName(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
