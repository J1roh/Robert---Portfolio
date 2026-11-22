// One-off: copy the live Supabase data into Cloudflare D1 + KV. Run after the wrangler.jsonc setup steps 1-4.
//
// 1. Supabase dashboard → SQL editor → run:  select json_agg(e) from enquiries e;
//    Copy the single result cell into enquiries.json in the repo root (gitignored; delete it afterwards).
//    No enquiries yet? Skip this; the script then copies content and posters only.
// 2. node scripts/migrate-from-supabase.mjs [enquiries.json]
//
// It reads the content row (public, anon key), copies every poster in the Supabase `posters` bucket that the content
// points to into KV, rewrites those URLs to /api/posters/<key>, and writes content + enquiries to D1. Safe to re-run.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// The old project's public anon key (it was in deploy.yml). RLS only lets it read `content`.
const SUPABASE_URL = 'https://kadytgyfsfrdzztsqrqv.supabase.co'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZHl0Z3lmc2ZyZHp6dHNxcnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODExMzYsImV4cCI6MjEwNzU1NzEzNn0.Zp0AZGJieMB1bYAP-nrf8xvzYH-JEIWkws_JSHg43Tc'
const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/posters/`
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const tmp = mkdtempSync(join(tmpdir(), 'migrate-'))
const wrangler = (...args) => {
  // shell: true so Windows finds npx.cmd; every argument is quoted.
  const r = spawnSync('npx', ['wrangler', ...args].map((a) => `"${a}"`), { shell: true, stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`wrangler ${args[0]} ${args[1]} failed`)
}
const sql = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

try {
  // --- content ---
  const res = await fetch(`${SUPABASE_URL}/rest/v1/content?key=eq.site&select=value`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } })
  if (!res.ok) throw new Error(`Reading content failed: ${res.status} ${await res.text()} (paused? restore it in the dashboard first)`)
  const value = (await res.json())[0]?.value ?? null
  const statements = []

  if (value) {
    // --- posters: every details[title].image that points at the Supabase bucket ---
    let copied = 0
    for (const project of value.projects ?? []) {
      for (const details of Object.values(project.details ?? {})) {
        if (typeof details?.image !== 'string' || !details.image.startsWith(BUCKET)) continue
        const img = await fetch(details.image)
        const ext = TYPES[img.headers.get('content-type')?.split(';')[0] ?? '']
        if (!img.ok || !ext) {
          console.warn(`Skipped (${img.status}, ${img.headers.get('content-type')}): ${details.image}`)
          continue
        }
        const name = decodeURIComponent(details.image.slice(BUCKET.length)).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-')
        const key = `${name}.${ext}`
        const file = join(tmp, key)
        writeFileSync(file, Buffer.from(await img.arrayBuffer()))
        wrangler('kv', 'key', 'put', key, '--binding', 'POSTERS', '--remote', '--path', file)
        details.image = `/api/posters/${key}`
        copied++
      }
    }
    console.log(`Posters copied: ${copied}`)
    statements.push(
      `insert into content (key, value, updated_at) values ('site', ${sql(JSON.stringify(value))}, ${sql(new Date().toISOString())}) on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;`,
    )
  } else {
    console.log('No content row in Supabase; the site will use its bundled defaults.')
  }

  // --- enquiries ---
  const file = process.argv[2]
  if (file) {
    if (!existsSync(file)) throw new Error(`${file} not found`)
    const rows = JSON.parse(readFileSync(file, 'utf8')) ?? []
    for (const e of rows) {
      const status = ['inbox', 'archived', 'deleted'].includes(e.status) ? e.status : 'inbox'
      statements.push(
        `insert or replace into enquiries (id, created_at, name, email, company, service, timeline, message, read, status, deleted_at, ip_hash) values (${[
          e.id,
          new Date(e.created_at).toISOString(),
          e.name,
          String(e.email).toLowerCase(),
          e.company ?? '',
          e.service ?? '',
          e.timeline ?? '',
          e.message,
          e.read === true ? 1 : 0,
          status,
          e.deleted_at ? new Date(e.deleted_at).toISOString() : null,
          e.ip_hash ?? null,
        ]
          .map(sql)
          .join(', ')});`,
      )
    }
    console.log(`Enquiries: ${rows.length}`)
  }

  if (statements.length) {
    const sqlFile = join(tmp, 'data.sql')
    writeFileSync(sqlFile, statements.join('\n'))
    wrangler('d1', 'execute', 'portfolio', '--remote', '--file', sqlFile)
  }
  console.log('Done. Check the site, then delete enquiries.json (it holds personal data).')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
