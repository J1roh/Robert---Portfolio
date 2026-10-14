// Emails each new contact-form enquiry to the owner via Resend. Called by a Supabase Database Webhook on
// `enquiries` INSERT; a failure here never affects the visitor (their enquiry is already saved).
//
// One-time setup (run SQL 05 and 06 first):
//   1. Sign up at https://resend.com with bontilaojiroh@gmail.com; API Keys > Create (Sending access).
//      Without your own domain, Resend only delivers to the address you signed up with, which is all we need.
//   2. npx supabase login
//   3. npx supabase functions deploy notify-enquiry --use-api --project-ref kadytgyfsfrdzztsqrqv
//      (--use-api: no Docker needed. JWT check is off via supabase/config.toml; the secret header protects it.)
//   4. In your own terminal, so the key never lands in a chat or log:
//      npx supabase secrets set --project-ref kadytgyfsfrdzztsqrqv RESEND_API_KEY=re_... WEBHOOK_SECRET=<long random text>
//      Once the site is live (GitHub Pages): also SITE_URL=https://<user>.github.io/<repo> for the "Open in CMS" button.
//      Optional: NOTIFY_TO=<another inbox> (defaults to bontilaojiroh@gmail.com).
//   5. Supabase dashboard > Database > Webhooks > Create: table public.enquiries, event Insert only,
//      type Supabase Edge Functions > notify-enquiry, POST, timeout 5000, HTTP header x-webhook-secret: <same random text>.
//   Test without the database:  curl -X POST https://kadytgyfsfrdzztsqrqv.supabase.co/functions/v1/notify-enquiry
//     -H "x-webhook-secret: <secret>" -H "Content-Type: application/json"
//     -d "{\"type\":\"INSERT\",\"record\":{\"name\":\"Test Client\",\"email\":\"test@example.com\",\"message\":\"Hello\"}}"
//   Logs: Supabase > Edge Functions > notify-enquiry > Logs (403 = secret mismatch, 502 = Resend error).
import { enquiryEmail, type EnquiryRecord } from './email.ts'

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (req: Request) => Response | Promise<Response>): void }

Deno.serve(async (req) => {
  const secret = Deno.env.get('WEBHOOK_SECRET')
  // Only the webhook knows the secret; anything else calling this URL is turned away.
  if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('Forbidden', { status: 403 })

  const payload = (await req.json().catch(() => null)) as { type?: string; record?: EnquiryRecord } | null
  const record = payload?.record
  if (payload?.type !== 'INSERT' || !record?.email || !record.name) return new Response('Ignored', { status: 200 })

  const { subject, html, text } = enquiryEmail(record, Deno.env.get('SITE_URL') ?? '')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio enquiries <onboarding@resend.dev>',
      to: [Deno.env.get('NOTIFY_TO') ?? 'bontilaojiroh@gmail.com'],
      reply_to: record.email,
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    console.error('Resend failed', res.status, await res.text())
    return new Response('Email failed', { status: 502 })
  }
  return new Response('Sent', { status: 200 })
})
