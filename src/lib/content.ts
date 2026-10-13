import site from '../../content/site.json'
import projects from '../../content/projects.json'
import { mergeContent } from './merge-content.ts'

// Fetched after first paint: the Supabase client is about a third of the JS and the landing page renders from bundled defaults first.
const client = () => import('./supabase.ts').then((m) => m.supabase)

// Bundled JSON is type-checked at build time, so no runtime validation layer is needed.
export type Language = keyof typeof site.copy
export type Copy = (typeof site.copy)[Language]
// Per-title extras edited in the CMS, keyed by the title text in allTitles.
export type WorkDetails = { summary?: Record<Language, string>; link?: string; image?: string; video?: string; videoFirst?: boolean }
export type Project = Omit<(typeof projects)[number], 'details'> & { details?: Record<string, WorkDetails> }
export type Links = typeof site.links
export type Stat = Copy['stats'][number]

// The CMS-editable slice of the site; saved as one row (key 'site') in the Supabase `content` table.
export type Content = { projects: Project[]; stats: Record<Language, Stat[]>; clientRoster: string; links: Links }

export const defaults: Content = {
  // Cast: TS infers each project's details as a union of its literal title keys, not a Record.
  projects: projects as unknown as Project[],
  stats: { en: site.copy.en.stats, ja: site.copy.ja.stats },
  clientRoster: site.copy.en.clientRoster,
  links: site.links,
}

export async function loadContent(): Promise<Content> {
  const supabase = await client()
  if (!supabase) return defaults
  const { data, error } = await supabase.from('content').select('value').eq('key', 'site').maybeSingle()
  return error ? defaults : mergeContent(data?.value, defaults)
}

// Returns an error message, or null on success.
export async function saveContent(value: Content): Promise<string | null> {
  const supabase = await client()
  if (!supabase) return 'Supabase is not configured.'
  const { error } = await supabase.from('content').upsert({ key: 'site', value, updated_at: new Date().toISOString() })
  return error?.message ?? null
}

// Uploads a title image to the public `posters` bucket (supabase/mitigations/04). Returns its URL, or an error message.
export async function uploadPoster(file: File): Promise<{ url: string } | { error: string }> {
  const supabase = await client()
  if (!supabase) return { error: 'Supabase is not configured.' }
  // Same cap as the bucket's file_size_limit (supabase/mitigations/09); checked here for a friendlier message.
  if (file.size > 5 * 1024 * 1024) return { error: 'Images must be 5 MB or smaller.' }
  const path = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
  const { error } = await supabase.storage.from('posters').upload(path, file, { contentType: file.type })
  if (error) {
    return {
      error: /bucket not found/i.test(error.message)
        ? 'The "posters" storage bucket is missing. Run supabase/mitigations/04_posters_bucket.sql in the Supabase SQL editor, then try again.'
        : error.message,
    }
  }
  return { url: supabase.storage.from('posters').getPublicUrl(path).data.publicUrl }
}

export { site, projects }
