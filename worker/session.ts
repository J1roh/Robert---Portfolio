// CMS login: per-person accounts (users table in D1) and a signed, expiring session cookie. Pure Web Crypto, so node:test can run it.
const enc = new TextEncoder()
const hmacKey = (secret: string) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
const toB64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

export const SESSION_DAYS = 30
export const MIN_PASSWORD = 12
// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
const ITERATIONS = 100_000

// Token: "<userId>.<sessionVer>.<expiry ms>.<HMAC of the first three>". Nothing secret inside; only the server can make a valid one.
// sessionVer is bumped on a password change, which invalidates every older cookie for that account.
export async function signSession(secret: string, userId: string, ver: number, expiresAt: number) {
  const payload = `${userId}.${ver}.${expiresAt}`
  return `${payload}.${toB64url(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload)))}`
}

export async function verifySession(secret: string, token: string | undefined, now = Date.now()): Promise<{ userId: string; ver: number } | null> {
  const parts = (token ?? '').split('.')
  if (parts.length !== 4) return null
  const [userId, ver, expiry, sig] = parts
  if (!userId || !/^\d+$/.test(ver) || !(Number(expiry) > now)) return null
  try {
    // subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(`${userId}.${ver}.${expiry}`))
    return ok ? { userId, ver: Number(ver) } : null
  } catch {
    return null
  }
}

// Byte-by-byte compare without an early exit, so timing doesn't leak how much matched.
function sameBytes(x: Uint8Array, y: Uint8Array) {
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

// Only for the first sign-in, against the CMS_PASSWORD secret (see login() in worker/index.ts).
export async function samePassword(given: string, expected: string) {
  if (!expected) return false
  const [a, b] = await Promise.all([given, expected].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))))
  return sameBytes(new Uint8Array(a), new Uint8Array(b))
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256))
}

// Stored as "pbkdf2$<iterations>$<salt>$<hash>" (base64url).
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITERATIONS}$${toB64url(salt)}$${toB64url(await pbkdf2(password, salt, ITERATIONS))}`
}

export async function checkPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$')
  if (scheme !== 'pbkdf2' || !salt || !hash) return false
  try {
    return sameBytes(await pbkdf2(password, fromB64url(salt), Number(iterations)), fromB64url(hash))
  } catch {
    return false
  }
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
