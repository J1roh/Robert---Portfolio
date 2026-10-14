// The only way enquiries get saved (SQL 08 removes public inserts): checks a contact-form submission, then
// stores it. Order: honeypot → field limits → Cloudflare Turnstile (human check) → email domain (not disposable,
// can receive mail) → insert. The 05 trigger then enforces one per email/IP per 24 hours, and 07 emails the owner.
//
// Setup: npx supabase secrets set --project-ref kadytgyfsfrdzztsqrqv TURNSTILE_SECRET=<Turnstile secret key>
//        npx supabase functions deploy submit-enquiry --use-api --project-ref kadytgyfsfrdzztsqrqv
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every function automatically.
// disposable.json: github.com/disposable-email-domains/disposable-email-domains (disposable_email_blocklist.conf,
// one domain per line, converted to a JSON array). Refresh it the same way now and then.
import { canReceiveMail, cleanFields, emailDomain, isDisposable } from './checks.ts'
import disposableList from './disposable.json' with { type: 'json' }

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (req: Request) => Response | Promise<Response>): void }

const disposable = new Set<string>(disposableList as string[])

// The site's own pages only: local dev, temporary tunnels, and the live site (SITE_URL, e.g. GitHub Pages).
function allowedOrigin(origin: string | null) {
  if (!origin) return null
  const site = Deno.env.get('SITE_URL')
  const ok =
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin) ||
    (!!site && origin === new URL(site).origin)
  return ok ? origin : null
}

Deno.serve(async (req) => {
  const origin = allowedOrigin(req.headers.get('origin'))
  const cors = {
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  const reply = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { status: origin ? 204 : 403, headers: cors })
  if (req.method !== 'POST' || !origin) return reply(403, { error: 'forbidden' })

  const body = (await req.json().catch(() => null)) as { fields?: Record<string, unknown>; token?: string } | null
  // Honeypot: a hidden field only bots fill. Pretend success so they don't adapt.
  if (body?.fields?.website) return reply(200, { ok: true })

  const fields = cleanFields(body?.fields)
  if (!fields) return reply(400, { error: 'invalid' })

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? ''

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: Deno.env.get('TURNSTILE_SECRET'), response: body?.token ?? '', ...(ip ? { remoteip: ip } : {}) }),
  })
    .then((r) => r.json() as Promise<{ success?: boolean }>)
    .catch(() => ({ success: false }))
  if (!verify.success) return reply(400, { error: 'captcha' })

  const domain = emailDomain(fields.email)
  if (isDisposable(domain, disposable) || !(await canReceiveMail(domain, fetch))) return reply(400, { error: 'bad_email' })

  // Service role: public inserts are closed (SQL 08). x-client-ip lets the 05 trigger hash the visitor's IP,
  // not this function's; the trigger only trusts it for service-role requests.
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/enquiries`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...(ip ? { 'x-client-ip': ip } : {}),
    },
    body: JSON.stringify({ ...fields, service: '' }),
  })
  if (res.ok) return reply(200, { ok: true })

  const failure = await res.text()
  if (failure.includes('already_submitted')) return reply(409, { error: 'duplicate' })
  console.error('insert failed', res.status, failure)
  return reply(500, { error: 'server' })
})
