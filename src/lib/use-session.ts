import { useEffect, useState } from 'react'
import { api, jsonBody } from './api.ts'

// CMS sign-in state, shared by every component: the signed-in account, null when signed out, undefined while the first check is in flight.
// The session itself is an HttpOnly cookie set by the server (worker/session.ts), so the page can't read it; it asks.
export type Account = { email: string }

let current: Account | null | undefined
let checked = false
const listeners = new Set<(account: Account | null) => void>()
const set = (account: Account | null) => {
  current = account
  listeners.forEach((l) => l(account))
}
const refresh = () => api<Account>('session').then(({ data }) => set(data ?? null))

export function useSession() {
  const [session, setSession] = useState(current)

  useEffect(() => {
    listeners.add(setSession)
    if (!checked) {
      checked = true
      refresh()
    }
    return () => {
      listeners.delete(setSession)
    }
  }, [])

  return session
}

// Returns an error message, or null when signed in.
export async function signIn(email: string, password: string): Promise<string | null> {
  const { error, status } = await api('login', jsonBody('POST', { email, password }))
  if (error) return status === 401 ? 'Wrong email or password.' : error
  await refresh()
  return null
}

export async function signOut() {
  await api('logout', { method: 'POST' })
  set(null)
}

// Settings page (#/cms/settings). Returns an error message, or null on success.
export async function changePassword(current: string, next: string) {
  const { error } = await api('account/password', jsonBody('POST', { current, next }))
  return error?.replace(/ \(\d+\)$/, '') ?? null
}
