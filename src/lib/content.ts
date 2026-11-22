import site from '../../content/site.json'
import projects from '../../content/projects.json'
import { mergeContent } from './merge-content.ts'
import { api, jsonBody } from './api.ts'

// Bundled JSON is type-checked at build time, so no runtime validation layer is needed.
export type Language = keyof typeof site.copy
export type Copy = (typeof site.copy)[Language]
// Per-title extras edited in the CMS, keyed by the title text in allTitles.
// jaTitle: the title's JP display name; the EN text in allTitles stays the key. client and role override the category's.
export type WorkDetails = { jaTitle?: string; client?: Record<Language, string>; role?: Record<Language, string>; summary?: Record<Language, string>; link?: string; image?: string; video?: string; videoFirst?: boolean }
export type Project = Omit<(typeof projects)[number], 'details'> & {
  details?: Record<string, WorkDetails>
  // JP versions of the category's title and client; empty falls back to the EN value.
  jaTitle?: string
  jaClient?: string
}
export type Links = typeof site.links
export type Stat = Copy['stats'][number]

// The CMS-editable slice of the site; saved as one row (key 'site') in the D1 `content` table (worker/schema.sql).
export type Content = { projects: Project[]; stats: Record<Language, Stat[]>; clientRoster: Record<Language, string>; links: Links }

export const defaults: Content = {
  // Cast: TS infers each project's details as a union of its literal title keys, not a Record.
  projects: projects as unknown as Project[],
  stats: { en: site.copy.en.stats, ja: site.copy.ja.stats },
  clientRoster: { en: site.copy.en.clientRoster, ja: site.copy.ja.clientRoster },
  links: site.links,
}

// Bundled defaults if the backend can't be reached, so the site always renders.
export async function loadContent(): Promise<Content> {
  const { data } = await api<{ value: unknown }>('content')
  return mergeContent(data?.value, defaults)
}

// Returns an error message, or null on success.
export async function saveContent(value: Content): Promise<string | null> {
  return (await api('content', jsonBody('PUT', value))).error
}

// Uploads a title image (stored in Workers KV). Returns its URL, or an error message.
export async function uploadPoster(file: File): Promise<{ url: string } | { error: string }> {
  // Same cap as the server (worker/index.ts); checked here for a friendlier message.
  if (file.size > 5 * 1024 * 1024) return { error: 'Images must be 5 MB or smaller.' }
  const { data, error } = await api<{ url: string }>(`posters?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  return data ?? { error }
}

export { site, projects }
