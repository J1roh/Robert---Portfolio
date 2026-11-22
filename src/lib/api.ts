// Calls the site's own backend (worker/index.ts), same origin, so the CMS session cookie goes along automatically.
// error is a readable message ending in the HTTP status, e.g. "Not signed in (401)"; status 0 means the network failed.
export async function api<T>(path: string, init?: RequestInit): Promise<{ data: T; error: null; status: number } | { data?: undefined; error: string; status: number }> {
  try {
    const res = await fetch(`/api/${path}`, init)
    const body = await res.json().catch(() => null)
    if (res.ok) return { data: body as T, error: null, status: res.status }
    return { error: `${body?.error ?? res.statusText} (${res.status})`, status: res.status }
  } catch {
    return { error: 'Could not reach the server. Check your connection and try again.', status: 0 }
  }
}

export const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
