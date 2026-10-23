import { lazy, Suspense } from 'react'
import ScrambleText from '../../components/ScrambleText.tsx'
import type { Copy, Links } from '../../lib/content.ts'
import './contact.css'

// Loaded after first paint: the form pulls in the Supabase client.
const Enquiry = lazy(() => import('../../pages/Enquiry.tsx'))

export default function Contact({ copy, links }: { copy: Copy; links: Links }) {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="kicker">03 / {copy.contactEyebrow}</h2>
      <p className="contact-title"><ScrambleText text={copy.contactTitle} /></p>
      <Suspense fallback={null}>
        <Enquiry copy={copy} links={links} />
      </Suspense>
    </section>
  )
}
