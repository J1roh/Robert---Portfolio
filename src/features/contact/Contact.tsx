import ScrambleText from '../../components/ScrambleText.tsx'
import Arrow from '../../components/Arrow.tsx'
import type { Copy, Links } from '../../lib/content.ts'
import './contact.css'

export default function Contact({ copy, links }: { copy: Copy; links: Links }) {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="kicker">03 / {copy.contactEyebrow}</h2>
      <p className="contact-title"><ScrambleText text={copy.contactTitle} /></p>
      <div className="contact-row">
        <p>{copy.contactBody}</p>
        <a href="#/contact">
          <span>{copy.contactCta}</span>
          <Arrow />
        </a>
        {links.email && (
          <a href={`mailto:${links.email}`}>
            <span>{links.email}</span>
            <Arrow />
          </a>
        )}
      </div>
    </section>
  )
}
