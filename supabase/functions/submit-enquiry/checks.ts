// Spam checks for contact-form enquiries. Pure (no Deno or Node APIs; fetch is passed in) so node:test can run them.
export type EnquiryFields = { name: string; email: string; company: string; timeline: string; message: string }

// Same limits as the enquiries table's checks (supabase/mitigations/02).
const LIMITS = { name: [1, 200], email: [3, 320], company: [0, 200], timeline: [0, 200], message: [1, 5000] } as const
// Deliberately loose: something@domain.tld with no spaces. The DNS check below does the real work.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function cleanFields(input: unknown): EnquiryFields | null {
  if (typeof input !== 'object' || input === null) return null
  const raw = input as Record<string, unknown>
  const out = {} as Record<keyof EnquiryFields, string>
  for (const [key, [min, max]] of Object.entries(LIMITS) as [keyof EnquiryFields, readonly [number, number]][]) {
    const value = typeof raw[key] === 'string' ? (raw[key] as string).trim() : ''
    if (value.length < min || value.length > max) return null
    out[key] = value
  }
  out.email = out.email.toLowerCase()
  return EMAIL.test(out.email) ? out : null
}

export const emailDomain = (email: string) => email.slice(email.lastIndexOf('@') + 1).toLowerCase()

// Matches the domain itself or any parent, so "inbox.mailinator.com" is caught by "mailinator.com".
export function isDisposable(domain: string, list: ReadonlySet<string>) {
  const parts = domain.split('.')
  for (let i = 0; i < parts.length - 1; i++) if (list.has(parts.slice(i).join('.'))) return true
  return false
}

type Fetch = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<unknown> }>
type DnsAnswer = { Status?: number; Answer?: { type: number; data?: string }[] }

// Can this domain receive email? MX record, or an A record (the standard's fallback). Asked via Cloudflare's
// DNS-over-HTTPS. Only a definite "no" refuses: if the lookup itself fails or is slow, the enquiry is allowed,
// so a DNS hiccup never blocks a real client.
export async function canReceiveMail(domain: string, fetchFn: Fetch, timeoutMs = 3000): Promise<boolean> {
  const ask = async (type: 'MX' | 'A'): Promise<DnsAnswer | null> => {
    try {
      const res = await fetchFn(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
        headers: { accept: 'application/dns-json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
      return res.ok ? ((await res.json()) as DnsAnswer) : null
    } catch {
      return null
    }
  }
  const has = (a: DnsAnswer, type: number) => (a.Answer ?? []).some((r) => r.type === type)

  const mx = await ask('MX')
  if (!mx) return true
  if (mx.Status === 3) return false // NXDOMAIN: the domain doesn't exist
  const mxRecords = (mx.Answer ?? []).filter((r) => r.type === 15)
  // "Null MX" (0 .): the domain declares it never receives mail.
  if (mxRecords.length) return !mxRecords.every((r) => /^0\s+\.?$/.test((r.data ?? '').trim()))
  const a = await ask('A')
  if (!a) return true
  return a.Status !== 3 && has(a, 1)
}
