const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

type Stat = { value: string }
type Shape = { projects: unknown[]; stats: { en: Stat[]; ja: Stat[] }; clientRoster: string; links: Record<string, string> }

// The CMS only edits stat values, so the list, labels and notes come from the defaults; saved values apply by position.
const mergeStats = <S extends Stat>(saved: unknown, defaults: S[]): S[] =>
  defaults.map((d, i) => {
    const v = Array.isArray(saved) && isObj(saved[i]) ? saved[i].value : undefined
    return typeof v === 'string' ? { ...d, value: v } : d
  })

const mergeProject = (p: Record<string, unknown>, defaults: unknown[]) => {
  const merged: Record<string, unknown> = { ...(defaults.find((d) => isObj(d) && d.slug === p.slug) as object | undefined), ...p }
  // Rows saved before titles moved to allTitles keep a CMS-added category's list in `works`.
  const empty = !Array.isArray(merged.allTitles) || merged.allTitles.length === 0
  return empty && Array.isArray(p.works) ? { ...merged, allTitles: p.works } : merged
}

// The saved row comes from the network, so check its shape; any missing or malformed part keeps its default.
export function mergeContent<T extends Shape>(saved: unknown, defaults: T): T {
  if (!isObj(saved)) return defaults
  const stats = isObj(saved.stats) ? saved.stats : {}
  return {
    // Fields added to a bundled project after the row was saved (e.g. allTitles) come from its default, matched by slug.
    projects: Array.isArray(saved.projects) ? saved.projects.map((p) => (isObj(p) ? mergeProject(p, defaults.projects) : p)) : defaults.projects,
    stats: {
      en: mergeStats(stats.en, defaults.stats.en),
      ja: mergeStats(stats.ja, defaults.stats.ja),
    },
    clientRoster: typeof saved.clientRoster === 'string' ? saved.clientRoster : defaults.clientRoster,
    links: isObj(saved.links) ? { ...defaults.links, ...saved.links } : defaults.links,
  } as T
}
