import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Copy, Language, Project } from '../../lib/content.ts'
import { posterSrc } from '../../lib/posters.ts'
import { titleName } from '../../lib/poster-key.ts'
import { embedUrl } from '../../lib/video-embed.ts'
import Arrow from '../../components/Arrow.tsx'
import './projects.css'

const pad = (n: number) => String(n).padStart(2, '0')
// The title as shown: its JP name in JP when the CMS has one, else the EN title (which stays the key).
const display = (project: Project, title: string, language: Language) =>
  (language === 'ja' && project.details?.[title]?.jaTitle) || title
// The category's title and client in the current language, same fallback.
const categoryTitle = (project: Project, language: Language) => (language === 'ja' && project.jaTitle) || project.title
const client = (project: Project, language: Language) => (language === 'ja' && project.jaClient) || project.client


type Props = { copy: Copy; language: Language; projects: Project[] }
type Work = { project: Project; title: string }

export default function Projects({ copy, language, projects }: Props) {
  const [work, setWork] = useState<Work | null>(null)

  return (
    <section className="section" id="work" aria-labelledby="work-heading">
      <div className="section-heading">
        <h2 id="work-heading" className="kicker">01 / {copy.selected}</h2>
        <p>{pad(projects.length)} {copy.projectsCount}</p>
      </div>
      <div className="project-grid">
        {projects.map((project, i) => (
          <article className={project.wide ? 'project-card wide' : 'project-card'} key={project.slug}>
            <ProjectVisual project={project} number={i + 1} language={language} onOpen={(title) => setWork({ project, title })} />
            {/* Client and role are per title now (shown in the title's popup), not per category. */}
            <div className="project-meta">
              <h3>{categoryTitle(project, language)}</h3>
              <p className="project-subtitle">{project.subtitle[language]}</p>
            </div>
            {/* Full credit list; the card art shows a selection. `?.` covers CMS-added categories saved without one. */}
            {project.allTitles?.length > 0 && (
              <details className="project-all">
                <summary>
                  {copy.allTitles} ({project.allTitles.length})
                  <span className="project-all-icon" aria-hidden="true">+</span>
                </summary>
                <ul>
                  {project.allTitles.map((title, j) => (
                    <li key={title} style={{ '--i': j } as CSSProperties}>{display(project, title, language)}</li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))}
      </div>
      {work && <WorkDialog work={work} copy={copy} language={language} onClose={() => setWork(null)} />}
    </section>
  )
}

// A title's details, copied one-to-one from the owner's Figma Make zip: poster left, credits right.
// Native <dialog> + showModal() gives focus trapping, Esc to close and an inert page behind it.
function WorkDialog({ work, copy, language, onClose }: { work: Work; copy: Copy; language: Language; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { project, title } = work
  const details = project.details?.[title]
  const src = details?.image || posterSrc(title)
  const summary = details?.summary?.[language]
  const video = details?.video ? embedUrl(details.video) : null
  // Image and video become slides when both exist; the owner picks which comes first in the CMS.
  const slides = [src && 'image', video && 'video'].filter(Boolean) as ('image' | 'video')[]
  if (details?.videoFirst) slides.reverse()
  const [slide, setSlide] = useState(0)
  const current = slides[slide]
  // The heading is the work's name; its credit note ("— Translator, PM, …" or "(except opening song)") goes below,
  // so long credit lines don't blow the heading up past the screen.
  const shown = display(project, title, language)
  const name = titleName(shown)
  const note = shown.slice(name.length).trim().replace(/^— /, '')

  useEffect(() => ref.current?.showModal(), [])

  // Inverted tilt (owner request): the card lies flat while the pointer is on it and leans toward the pointer,
  // up to ±3°, while it moves over the backdrop around it. Written straight to the card's style (no re-render
  // per move); CSS eases it. The faint highlight still follows the pointer on the card. Mouse/pen only.
  const card = useRef<HTMLElement>(null)
  const setTilt = (rx: number, ry: number) => {
    card.current?.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    card.current?.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
  }
  const tilt = (e: PointerEvent<HTMLElement>) => {
    if (!card.current || e.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const box = card.current.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width - 0.5
    const y = (e.clientY - box.top) / box.height - 0.5
    if (Math.abs(x) <= 0.5 && Math.abs(y) <= 0.5) {
      setTilt(0, 0)
      card.current.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
      card.current.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
      return
    }
    // Outside the card: full tilt once the pointer is about half a card away from its centre.
    const clamp = (v: number) => Math.max(-1, Math.min(1, v))
    setTilt(-clamp(y) * 3, clamp(x) * 3)
  }

  return (
    // The dialog is the full-screen overlay; a click on it (not on the card) closes, as in the zip.
    <dialog ref={ref} className="project-modal" aria-labelledby="project-modal-title" onClose={onClose} onClick={(e) => e.target === e.currentTarget && ref.current?.close()} onPointerMove={tilt} onPointerLeave={() => setTilt(0, 0)}>
      <article ref={card} className="project-modal-card">
        <button type="button" className="project-modal-close" aria-label={copy.close} onClick={() => ref.current?.close()}>×</button>
        <div className={current ? 'project-modal-image has-image' : 'project-modal-image'}>
          {/* Mounted only while shown, so switching slides or closing stops playback. */}
          {current === 'video' ? (
            <iframe src={video!} title={name} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : current === 'image' ? (
            <img src={src} alt="" />
          ) : (
            <div>
              <span>PROJECT IMAGE</span>
              <strong>IMAGE<br />PLACEHOLDER</strong>
            </div>
          )}
          {slides.length > 1 && (
            <div className="project-modal-dots">
              {slides.map((kind, i) => (
                <button key={kind} type="button" aria-label={kind === 'video' ? copy.showVideo : copy.showImage} aria-pressed={i === slide} onClick={() => setSlide(i)} />
              ))}
            </div>
          )}
        </div>
        <div className="project-modal-content">
          <p className="kicker">{categoryTitle(project, language)}</p>
          <h2 id="project-modal-title">{name}</h2>
          {note && <p className="project-modal-note">{note}</p>}
          <dl>
            <div>
              <dt>{copy.client}</dt>
              <dd>{details?.client?.[language] || client(project, language)}</dd>
            </div>
            <div>
              <dt>{copy.role}</dt>
              <dd>{details?.role?.[language] || project.role[language]}</dd>
            </div>
          </dl>
          {/* The zip shows placeholder text when empty; visitors shouldn't see that, so it's left out. */}
          {summary && <p className="project-modal-summary">{summary}</p>}
          {details?.link && (
            <a href={details.link} target="_blank" rel="noopener noreferrer">
              {copy.viewProject} <Arrow />
            </a>
          )}
        </div>
      </article>
    </dialog>
  )
}

// The card's coloured panel; the background shows the image of the last hovered title (first title until then).
// Circular distance from `from` to `j` in a ring of n posters: -half…(n - 1 - half), so posters wrap around both sides.
const ringOffset = (j: number, from: number, n: number) => {
  const half = Math.floor(n / 2)
  return ((((j - from) % n) + n + half) % n) - half
}

type VisualProps = { project: Project; number: number; language: Language; onOpen: (title: string) => void }

function ProjectVisual({ project, number, language, onOpen }: VisualProps) {
  // pos counts every step taken (never wraps), so each poster knows which lap of the ring it is on.
  const [{ shown, pos }, setView] = useState({ shown: 0, pos: 0 })
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)
  const visual = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const srcs = project.allTitles.map((title) => project.details?.[title]?.image || posterSrc(title))
  const n = srcs.length
  const show = (j: number) => setView((v) => ({ shown: j, pos: v.pos + ringOffset(j, v.shown, n) }))

  // Rotates only while on screen, so off-screen cards don't run timers.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(visual.current!)
    return () => observer.disconnect()
  }, [])

  // Steps to the next title every 3s unless the pointer is on the card (then hover drives it) or motion is reduced.
  useEffect(() => {
    if (hovered || !visible || n < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setView((v) => {
      const next = (v.shown + 1) % n
      return { shown: next, pos: v.pos + ringOffset(next, v.shown, n) }
    }), 3000)
    return () => clearInterval(id)
  }, [hovered, visible, n])

  // Keeps the current title in view inside the list; scrollTo on the list only, so the page never moves.
  useEffect(() => {
    const ol = list.current
    const li = ol?.children[shown] as HTMLElement | undefined
    if (!ol || !li || hovered) return
    ol.scrollTo({ top: li.offsetTop - ol.clientHeight / 2 + li.offsetHeight / 2, behavior: 'smooth' })
  }, [shown, hovered])

  return (
    <div
      ref={visual}
      className={`project-visual project-${project.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Coverflow: the hovered title's poster sits flat in the centre, the others angle away by distance (--d). */}
      {srcs.some(Boolean) && (
        <div className="project-bg-track" aria-hidden="true">
          {srcs.map((src, j) => {
            const d = ringOffset(j, shown, n)
            // The lap changes only when this poster wraps to the other end; the new key remounts it there
            // (fading in) instead of animating it across the whole card.
            const lap = (d + pos - j) / n
            const style = { '--d': d, '--a': Math.abs(d), zIndex: n - Math.abs(d) } as CSSProperties
            return src && <img key={`${j}:${lap}`} className="project-bg" src={src} alt="" loading="lazy" style={style} />
          })}
        </div>
      )}
      <span className="project-number" aria-hidden="true">{pad(number)}</span>
      {/* Decorative repeat of the title below; hidden so screen readers hear it once */}
      <div className="project-mark" aria-hidden="true">
        <p>{project.label[language]}</p>
        <span className="project-mark-title">{categoryTitle(project, language)}</span>
        <small>日本語 → ENGLISH</small>
      </div>
      <ol className="project-list" ref={list}>
        {project.allTitles.map((title, j) => (
          <li key={title} aria-current={j === shown || undefined} onMouseEnter={() => show(j)}>
            <span aria-hidden="true">{pad(j + 1)}</span>
            <button type="button" onFocus={() => show(j)} onClick={() => onOpen(title)}>{display(project, title, language)}</button>
          </li>
        ))}
      </ol>
    </div>
  )
}
