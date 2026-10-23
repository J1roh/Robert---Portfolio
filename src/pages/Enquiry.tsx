import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase.ts'
import { sendEnquiry } from '../lib/enquiries.ts'
import type { Copy, Links } from '../lib/content.ts'
import Arrow from '../components/Arrow.tsx'
import './enquiry.css'

// Contact page (#/contact), after the owner's "Parallax Scrolling Website" design. Enquiries are saved to Supabase
// and read in the CMS. Max lengths match the table's checks in supabase/mitigations/02_create_enquiries_table.sql.
// Send times on this browser. The server refuses a 4th within 2 days anyway (supabase/mitigations/13);
// this just shows the "already sent" note up front instead of letting the visitor fill the form in vain.
const SENT_KEY = 'enquiry-sent-times'
const LIMIT = 3
const WINDOW_MS = 2 * 864e5
const recentSends = (): number[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((t) => typeof t === 'number' && Date.now() - t < WINDOW_MS) : []
  } catch {
    return []
  }
}
const sentRecently = () => recentSends().length >= LIMIT

export default function Enquiry({ copy, links }: { copy: Copy; links: Links }) {
  const text = copy.enquiry
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'duplicate'>(() => (sentRecently() ? 'duplicate' : 'idle'))
  // Bumped after a send to remount the form, which clears every field including the custom select.
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    setError('')
    // Honeypot: hidden from people, so only bots fill it. Pretend success and send nothing.
    if (field('website')) {
      setStatus('sent')
      return
    }
    setStatus('sending')
    const result = await sendEnquiry({
      name: field('name'),
      email: field('email'),
      company: field('company'),
      // No service picker on the form (owner found it restrictive); the column stays for older enquiries.
      service: '',
      timeline: field('timeline'),
      message: field('message'),
    })
    if (typeof result === 'object') {
      setError(result.error)
      setStatus('idle')
      return
    }
    if (result === 'sent') {
      localStorage.setItem(SENT_KEY, JSON.stringify([...recentSends(), Date.now()]))
      setFormKey((k) => k + 1)
    }
    setStatus(result)
  }

  const elsewhere = [
    { href: links.linkedin, label: 'LinkedIn' },
    { href: links.x, label: links.xLabel },
  ]

  return (
    <div className="enquiry-page">
      <section className="enquiry-grid" aria-labelledby="enquiry-heading">
        <div className="enquiry-intro">
          <p className="kicker">{text.eyebrow}</p>
          <h1 id="enquiry-heading">
            {text.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="enquiry-direct">
            <p>{text.direct}</p>
            {elsewhere.map(({ href, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                {label}
                <span aria-hidden="true">↗</span>
                <span className="visually-hidden"> {copy.newTab}</span>
              </a>
            ))}
            {links.email && (
              <a href={`mailto:${links.email}`}>
                {links.email}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>

        {!supabase ? (
          <p className="enquiry-form" role="alert">{text.notConfigured}</p>
        ) : status === 'duplicate' ? (
          <p className="enquiry-form enquiry-already" role="status">{text.alreadySent}</p>
        ) : (
          <form key={formKey} className="enquiry-form" onSubmit={onSubmit}>
            <div className="enquiry-form-row">
              <label>
                {text.name}
                <input name="name" required maxLength={200} autoComplete="name" />
              </label>
              <label>
                {text.email}
                <input name="email" type="email" required maxLength={320} autoComplete="email" />
              </label>
            </div>
            <label>
              {text.company}
              <input name="company" maxLength={200} autoComplete="organization" />
            </label>
            <label>
              {text.timeline}
              <input name="timeline" maxLength={200} placeholder={text.timelinePlaceholder} />
            </label>
            <label>
              {text.message}
              <textarea name="message" required maxLength={5000} rows={5} placeholder={text.messagePlaceholder} />
            </label>
            <label className="enquiry-trap" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <div className="enquiry-submit-row">
              <p>{text.note}</p>
              <button type="submit" disabled={status === 'sending'}>
                <span>{status === 'sending' ? text.sending : text.submit}</span>
                <Arrow />
              </button>
            </div>
            <p className="enquiry-status" role="status">{status === 'sent' ? text.sent : ''}</p>
            {error && <p className="enquiry-error" role="alert">{error}</p>}
          </form>
        )}
      </section>

      <p className="enquiry-back">
        <a href="#/">← {text.back}</a>
      </p>
    </div>
  )
}
