import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase.ts'
import { site } from '../lib/content.ts'
import { useSession } from '../lib/use-session.ts'
import Arrow from '../components/Arrow.tsx'
import './login.css'

const text = site.login

export default function Login() {
  const session = useSession()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Already signed in on this browser (Supabase keeps the session): skip the form and open the CMS.
  // Inside the CMS this component only renders while signed out, so it never loops.
  useEffect(() => {
    if (session && !location.hash.startsWith('#/cms')) location.replace('#/cms')
  }, [session])

  if (!supabase) {
    return (
      <section className="login-panel">
        <h1>{text.heading}</h1>
        <p role="alert">Login is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.</p>
      </section>
    )
  }
  const auth = supabase.auth
  if (session) return null

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    const { error } = await auth.signInWithPassword({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setBusy(false)
    if (error) setError(error.message)
    else location.hash = '#/cms'
  }

  return (
    <section className="login-panel">
      <p className="kicker">{text.kicker}</p>
      <h1>{text.heading}</h1>
      {session === undefined ? null : (
        <>
          <p className="login-copy">{text.intro}</p>
          <form className="login-form" onSubmit={onSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="login-button" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : text.submit} <Arrow />
            </button>
          </form>
        </>
      )}
      <a className="back-link" href="#top">{text.back}</a>
    </section>
  )
}
