// The site's backend on Cloudflare's free plan (replaces Supabase). Serves the built site from dist/ and a small JSON API:
//   GET  /api/content               public   the CMS content row
//   PUT  /api/content               signed in save it
//   POST /api/posters?name=x.jpg    signed in upload a title image (raw body) to KV
//   GET  /api/posters/<key>         public   serve it
//   POST /api/enquiries             public   contact form
//   GET  /api/enquiries             signed in inbox (also purges long-deleted rows)
//   GET  /api/enquiries/unread      signed in sidebar badge count
//   PATCH /api/enquiries/<id>       signed in read / status / deleted_at
//   GET  /api/session, POST /api/login, POST /api/logout
//   POST /api/account/password      signed in change the password
// One CMS account only (users table holds a single row). Setup and secrets: see wrangler.jsonc.
import { canReceiveMail, cleanFields, emailDomain, isDisposable } from './checks.ts'
import { enquiryEmail } from './email.ts'
import { MIN_PASSWORD, SESSION_DAYS, checkPassword, hashPassword, samePassword, sha256Hex, signSession, verifySession } from './session.ts'
import disposableList from './disposable.json' with { type: 'json' }

interface Env {
  ASSETS: Fetcher
  DB: D1Database
  POSTERS: KVNamespace
  CMS_PASSWORD: string
  SESSION_SECRET: string
  RESEND_API_KEY?: string
  NOTIFY_TO?: string
}

const disposable = new Set<string>(disposableList as string[])
const DAY = 864e5
const DELETED_DAYS = 30 // keep in step with src/lib/enquiries.ts
const ENQUIRY_LIMIT = 3 // per email or network every 2 days, as the old supabase/mitigations/13 trigger
const LOGIN_LIMIT = 5 // failed logins per network every 15 minutes
const MAX_POSTER = 5 * 1024 * 1024
const MAX_CONTENT = 1024 * 1024
const POSTER_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const STATUSES = ['inbox', 'archived', 'deleted']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type User = { id: string; email: string; session_ver: number }

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } })
const fail = (status: number, error: string) => json({ error }, status)

const cookie = (token: string, maxAge: number) => `session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
const readCookie = (req: Request, name: string) =>
  req.headers.get('cookie')?.split(';').map((c) => c.trim().split('=')).find(([k]) => k === name)?.[1]
const ipHash = (req: Request) => {
  const ip = req.headers.get('cf-connecting-ip') ?? ''
  return ip ? sha256Hex(`${ip}:rrds-enquiry`) : Promise.resolve(null)
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req)
    const path = url.pathname.slice('/api/'.length)
    const method = req.method
    // The signed-in account, or null. The cookie only counts while its version matches,
    // so changing the password signs other browsers out straight away.
    let signedIn: Promise<User | null> | undefined
    const user = () =>
      (signedIn ??= verifySession(env.SESSION_SECRET, readCookie(req, 'session')).then(async (s) => {
        if (!s) return null
        const row = await env.DB.prepare('select id, email, session_ver from users where id = ?').bind(s.userId).first<User>()
        return row && row.session_ver === s.ver ? row : null
      }))

    try {
      // --- session ---
      if (path === 'session' && method === 'GET') {
        const me = await user()
        return me ? json({ email: me.email }) : fail(401, 'Not signed in')
      }
      if (path === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) })
      if (path === 'login' && method === 'POST') return await login(req, env)

      // --- account ---
      if (path === 'account/password' && method === 'POST') {
        const me = await user()
        if (!me) return fail(401, 'Not signed in')
        const body = (await req.json().catch(() => null)) as { current?: unknown; next?: unknown } | null
        const row = await env.DB.prepare('select pw_hash from users where id = ?').bind(me.id).first<{ pw_hash: string }>()
        if (!row || !(await checkPassword(String(body?.current ?? ''), row.pw_hash))) return fail(403, 'Current password is wrong.')
        const next = String(body?.next ?? '')
        if (next.length < MIN_PASSWORD) return fail(400, `Use at least ${MIN_PASSWORD} characters.`)
        // New version: other browsers on this account are signed out; this one gets a fresh cookie.
        const ver = me.session_ver + 1
        await env.DB.prepare('update users set pw_hash = ?, session_ver = ? where id = ?').bind(await hashPassword(next), ver, me.id).run()
        return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, me.id, ver) })
      }

      // --- content ---
      if (path === 'content' && method === 'GET') {
        const row = await env.DB.prepare('select value from content where key = ?').bind('site').first<{ value: string }>()
        return json({ value: row ? JSON.parse(row.value) : null })
      }
      if (path === 'content' && method === 'PUT') {
        if (!(await user())) return fail(401, 'Not signed in')
        const text = await req.text()
        if (text.length > MAX_CONTENT) return fail(413, 'Content is too large')
        let value: unknown
        try {
          value = JSON.parse(text)
        } catch {
          return fail(400, 'Content must be JSON')
        }
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail(400, 'Content must be an object')
        await env.DB.prepare(
          'insert into content (key, value, updated_at) values (?, ?, ?) on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at',
        ).bind('site', text, new Date().toISOString()).run()
        return json({ ok: true })
      }

      // --- posters ---
      if (path === 'posters' && method === 'POST') {
        if (!(await user())) return fail(401, 'Not signed in')
        const ext = POSTER_TYPES[req.headers.get('content-type') ?? '']
        if (!ext) return fail(415, 'Images must be JPEG, PNG or WebP.')
        const body = await req.arrayBuffer()
        if (body.byteLength > MAX_POSTER) return fail(413, 'Images must be 5 MB or smaller.')
        const base = (url.searchParams.get('name') ?? 'poster').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').slice(0, 80)
        const key = `${Date.now()}-${base}.${ext}`
        await env.POSTERS.put(key, body)
        return json({ url: `/api/posters/${key}` })
      }
      if (path.startsWith('posters/') && method === 'GET') {
        const key = path.slice('posters/'.length)
        const type = Object.entries(POSTER_TYPES).find(([, ext]) => key.endsWith(`.${ext}`))?.[0]
        const file = /^[a-z0-9.-]+$/.test(key) && type ? await env.POSTERS.get(key, 'arrayBuffer') : null
        if (!file) return new Response('Not found', { status: 404 })
        // Keys are never reused (timestamped), so the file can be cached forever.
        return new Response(file, { headers: { 'Content-Type': type!, 'Cache-Control': 'public, max-age=31536000, immutable' } })
      }

      // --- enquiries ---
      if (path === 'enquiries' && method === 'POST') return await submitEnquiry(req, env, ctx, url.origin)
      if (path === 'enquiries' && method === 'GET') {
        if (!(await user())) return fail(401, 'Not signed in')
        // Best effort: a failed purge just leaves old deleted messages for the next load.
        const cutoff = new Date(Date.now() - DELETED_DAYS * DAY).toISOString()
        await env.DB.prepare("delete from enquiries where status = 'deleted' and deleted_at < ?").bind(cutoff).run().catch(() => {})
        const { results } = await env.DB.prepare(
          'select id, created_at, name, email, company, service, timeline, message, read, status, deleted_at from enquiries order by created_at desc',
        ).all<Record<string, unknown>>()
        return json(results.map((e) => ({ ...e, read: e.read === 1 })))
      }
      if (path === 'enquiries/unread' && method === 'GET') {
        if (!(await user())) return fail(401, 'Not signed in')
        const row = await env.DB.prepare("select count(*) as n from enquiries where read = 0 and status <> 'deleted'").first<{ n: number }>()
        return json({ count: row?.n ?? 0 })
      }
      if (path.startsWith('enquiries/') && method === 'PATCH') {
        if (!(await user())) return fail(401, 'Not signed in')
        const patch = (await req.json().catch(() => null)) as Record<string, unknown> | null
        const sets: string[] = []
        const values: unknown[] = []
        const set = (column: string, value: unknown) => {
          sets.push(`${column} = ?`)
          values.push(value)
        }
        if (typeof patch?.read === 'boolean') set('read', patch.read ? 1 : 0)
        if (typeof patch?.status === 'string' && STATUSES.includes(patch.status)) set('status', patch.status)
        if (patch && 'deleted_at' in patch && (patch.deleted_at === null || typeof patch.deleted_at === 'string')) set('deleted_at', patch.deleted_at)
        if (!sets.length) return fail(400, 'Nothing to update')
        await env.DB.prepare(`update enquiries set ${sets.join(', ')} where id = ?`).bind(...values, path.slice('enquiries/'.length)).run()
        return json({ ok: true })
      }

      return fail(404, 'Not found')
    } catch (err) {
      console.error(method, path, err)
      return fail(500, 'Server error')
    }
  },
} satisfies ExportedHandler<Env>

async function login(req: Request, env: Env) {
  const hash = (await ipHash(req)) ?? 'unknown'
  const since = new Date(Date.now() - 15 * 60e3).toISOString()
  await env.DB.prepare('delete from login_failures where at < ?').bind(since).run()
  const recent = await env.DB.prepare('select count(*) as n from login_failures where ip_hash = ?').bind(hash).first<{ n: number }>()
  if ((recent?.n ?? 0) >= LOGIN_LIMIT) return fail(429, 'Too many attempts. Try again in 15 minutes.')

  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''
  const now = new Date().toISOString()

  let row = await env.DB.prepare('select id, pw_hash, session_ver from users where email = ?').bind(email).first<{ id: string; pw_hash: string; session_ver: number }>()
  let ok = row ? await checkPassword(password, row.pw_hash) : false
  if (!row) {
    // First sign-in: while there is no account, the CMS_PASSWORD secret creates the one account with the email typed.
    // One statement, so two people racing to be first can't both create one.
    const anyone = await env.DB.prepare('select 1 from users limit 1').first()
    if (!anyone && EMAIL.test(email) && (await samePassword(password, env.CMS_PASSWORD))) {
      const id = crypto.randomUUID()
      const made = await env.DB.prepare(
        'insert into users (id, email, pw_hash, created_at) select ?, ?, ?, ? where not exists (select 1 from users)',
      ).bind(id, email, await hashPassword(password), now).run()
      if (made.meta.changes) {
        row = { id, pw_hash: '', session_ver: 0 }
        ok = true
      }
    } else {
      // Same PBKDF2 cost as a real check, so response time doesn't reveal whether the email is right.
      await hashPassword(password)
    }
  }
  if (!row || !ok) {
    await env.DB.prepare('insert into login_failures (ip_hash, at) values (?, ?)').bind(hash, now).run()
    return fail(401, 'Wrong email or password')
  }
  await env.DB.prepare('update users set last_login_at = ? where id = ?').bind(now, row.id).run()
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, row.id, row.session_ver) })
}

async function sessionCookie(env: Env, userId: string, ver: number) {
  return cookie(await signSession(env.SESSION_SECRET, userId, ver, Date.now() + SESSION_DAYS * DAY), SESSION_DAYS * 86400)
}

async function submitEnquiry(req: Request, env: Env, ctx: ExecutionContext, origin: string) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  // Honeypot: a hidden field only bots fill. Pretend success so they don't adapt.
  if (body?.website) return json({ ok: true })
  const fields = cleanFields(body)
  if (!fields) return fail(400, 'invalid')
  const domain = emailDomain(fields.email)
  if (isDisposable(domain, disposable) || !(await canReceiveMail(domain, fetch))) return fail(400, 'bad_email')

  const hash = await ipHash(req)
  const since = new Date(Date.now() - 2 * DAY).toISOString()
  const recent = await env.DB.prepare('select count(*) as n from enquiries where created_at > ? and (email = ? or (? is not null and ip_hash = ?))')
    .bind(since, fields.email, hash, hash)
    .first<{ n: number }>()
  if ((recent?.n ?? 0) >= ENQUIRY_LIMIT) return fail(409, 'already_submitted')

  const record = { ...fields, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  await env.DB.prepare(
    'insert into enquiries (id, created_at, name, email, company, service, timeline, message, ip_hash) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(record.id, record.created_at, fields.name, fields.email, fields.company, '', fields.timeline, fields.message, hash).run()

  // Email the owner after replying; a failure here never affects the visitor (the enquiry is saved).
  if (env.RESEND_API_KEY) ctx.waitUntil(notify(env, record, origin))
  return json({ ok: true })
}

async function notify(env: Env, record: Parameters<typeof enquiryEmail>[0], siteUrl: string) {
  const { subject, html, text } = enquiryEmail(record, siteUrl)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio enquiries <onboarding@resend.dev>',
      to: [env.NOTIFY_TO ?? 'bontilaojiroh@gmail.com'],
      reply_to: record.email,
      subject,
      html,
      text,
    }),
  })
  if (!res.ok) console.error('Resend failed', res.status, await res.text())
}
