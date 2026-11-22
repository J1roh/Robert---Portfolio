import { useState, type FormEvent } from 'react'
import { changePassword, type Account } from '../lib/use-session.ts'

// CMS Settings page (#/cms/settings): change the CMS password.
// Keep in step with MIN_PASSWORD in worker/session.ts; the server checks it too.
const MIN_PASSWORD = 12

export default function CmsSettings({ account }: { account: Account }) {
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const next = String(form.get('next'))
    setNotice('')
    if (next !== form.get('confirm')) return setError('The new passwords don’t match.')
    setBusy(true)
    setError('')
    const message = await changePassword(String(form.get('current')), next)
    setBusy(false)
    if (message) return setError(message)
    setNotice('Password changed. Other browsers signed in to the CMS have been signed out.')
    formEl.reset()
  }

  return (
    <>
      <header className="cms-header">
        <div>
          <p>Account</p>
          <h1>Settings</h1>
        </div>
      </header>
      {error && <p className="cms-error" role="alert">{error}</p>}
      {notice && <p className="cms-restored" role="status">{notice}</p>}

      <section className="cms-settings-card" aria-labelledby="settings-account">
        <div className="cms-block-heading">
          <div>
            <p>Signed in as</p>
            <h2 id="settings-account">{account.email}</h2>
          </div>
        </div>
        <form className="editor-fields" onSubmit={onPassword}>
          {/* Hidden username so password managers update the right saved login. */}
          <input type="email" name="username" autoComplete="username" value={account.email} readOnly hidden />
          <label className="full-field">
            Current password
            <input name="current" type="password" autoComplete="current-password" required />
          </label>
          <label>
            New password (at least {MIN_PASSWORD} characters)
            <input name="next" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
          </label>
          <label>
            Repeat new password
            <input name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
          </label>
          <button type="submit" className="cms-settings-submit" disabled={busy}>Change password</button>
        </form>
      </section>
    </>
  )
}
