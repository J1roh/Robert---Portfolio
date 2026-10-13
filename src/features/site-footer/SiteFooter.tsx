import { site, type Copy, type Links } from '../../lib/content.ts'
import './site-footer.css'

const year = new Date().getFullYear()

export default function SiteFooter({ copy, links }: { copy: Copy; links: Links }) {
  return (
    <footer className="site-footer">
      <p>© {year} {site.name.toUpperCase()}</p>
      <a href={links.x} target="_blank" rel="noopener noreferrer">
        {links.xLabel}
        <span className="visually-hidden"> {copy.newTab}</span>
      </a>
      <p>{copy.location}</p>
    </footer>
  )
}
