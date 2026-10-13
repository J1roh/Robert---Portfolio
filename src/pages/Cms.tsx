import { useEffect, useState, type KeyboardEvent } from 'react'
import { supabase } from '../lib/supabase.ts'
import { defaults, saveContent, site, uploadPoster, type Content, type Language, type Project, type WorkDetails } from '../lib/content.ts'
import { mergeContent } from '../lib/merge-content.ts'
import { posterSrc } from '../lib/posters.ts'
import { posterKey } from '../lib/poster-key.ts'
import { countUnread } from '../lib/enquiries.ts'
import { useSession } from '../lib/use-session.ts'
import Login from './Login.tsx'
import CmsEnquiries from './CmsEnquiries.tsx'
import CmsTitleEditor from './CmsTitleEditor.tsx'
import CmsLangToggle from './CmsLangToggle.tsx'
import CmsConfirm from './CmsConfirm.tsx'
import './cms.css'

// Unsaved edits are kept in this browser, so a reload, a sign-out or an expired session never loses them.
const DRAFT_KEY = 'cms-draft'
const readDraft = (): { savedAt: number; draft: Content } | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    return stored?.draft ? { savedAt: Number(stored.savedAt), draft: mergeContent(stored.draft, defaults) } : null
  } catch {
    return null
  }
}
const same = (a: Content, b: Content) => JSON.stringify(a) === JSON.stringify(b)
// Errors meaning the login no longer allows writing (expired session, or an account that isn't the admin).
const AUTH_ERROR = /jwt|row-level security|permission denied|not authori[sz]ed|401|403/i

// Layout follows the owner's "Parallax Scrolling Website" CMS design (Figma Make zip).
const ENQUIRIES = '#/cms/enquiries'
const pad = (n: number) => String(n).padStart(2, '0')
const languages: Language[] = ['en', 'ja']
// Sidebar order from the design. Enquiries is its own page (#/cms/enquiries); the rest are sections of #/cms.
const sections = [
  { id: 'cms-profile', label: 'Profile' },
  { id: 'cms-portfolio', label: 'Portfolio' },
  { id: 'cms-socials', label: 'Social links' },
  { id: ENQUIRIES, label: 'Enquiries' },
]
const scrollBehavior = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')

// Moves item `from` to index `to`; used by drag-and-drop and Alt+Arrow keys.
const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

type Props = { content: Content; onSaved: (content: Content) => void; page: 'content' | 'enquiries' }

// Stays mounted across #/cms and #/cms/enquiries, so unsaved content edits survive a visit to the inbox.
export default function Cms({ content, onSaved, page }: Props) {
  const session = useSession()
  // A section picked from the Enquiries page; scrolled to once the content page has rendered.
  const [pending, setPending] = useState<string | null>(null)
  const [draft, setDraft] = useState(content)
  // null on first render, so a stored draft is checked for straight away.
  const [base, setBase] = useState<Content | null>(null)
  // When unsaved changes were restored from this browser, and when they were made.
  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const [moving, setMoving] = useState('')
  // Delete waiting for confirmation: a title (by index) or the whole category.
  const [confirming, setConfirming] = useState<{ title: number } | 'category' | null>(null)
  const [unread, setUnread] = useState(0)
  const [active, setActive] = useState(0)
  const [section, setSection] = useState(sections[0].id)
  const [dragged, setDragged] = useState<number | null>(null)
  // Index of the title open in the "Edit project" modal.
  const [editing, setEditing] = useState<number | null>(null)
  // Language of the translated fields being edited (EN / JP toggle), shared with the title editor.
  const [lang, setLang] = useState<Language>('en')
  const [status, setStatus] = useState<'saved' | 'saving' | 'dirty'>('saved')
  const [error, setError] = useState('')

  // Content can arrive from Supabase after this page mounts; start editing from the latest,
  // unless this browser holds unsaved changes that differ from it.
  if (base !== content) {
    setBase(content)
    const stored = readDraft()
    if (stored && !same(stored.draft, content)) {
      setDraft(stored.draft)
      setStatus('dirty')
      setRestoredAt(stored.savedAt)
    } else {
      setDraft(content)
      setStatus('saved')
      setRestoredAt(null)
    }
  }

  useEffect(() => {
    if (status === 'dirty') localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), draft }))
    else if (status === 'saved') localStorage.removeItem(DRAFT_KEY)
  }, [draft, status])

  // The browser's own "leave site?" prompt while there are unpublished edits.
  useEffect(() => {
    if (status !== 'dirty') return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    addEventListener('beforeunload', warn)
    return () => removeEventListener('beforeunload', warn)
  }, [status])

  // Unread enquiries badge; refreshed when signing in, switching pages or coming back to the tab.
  useEffect(() => {
    if (!session) return
    const refresh = () => countUnread().then(setUnread)
    refresh()
    addEventListener('focus', refresh)
    return () => removeEventListener('focus', refresh)
  }, [session, page])

  useEffect(() => {
    if (page !== 'content' || !pending) return
    document.getElementById(pending)?.scrollIntoView({ behavior: scrollBehavior() })
    setPending(null)
  }, [page, pending])

  if (session === undefined) return null
  if (!session) {
    return (
      <main id="main" className="cms-signed-out">
        <Login />
      </main>
    )
  }

  const project = draft.projects[active]
  const langLabel = lang === 'ja' ? 'JP' : 'EN'
  const shortName = site.name.split(' ').slice(0, 2)

  const edit = (next: Content) => {
    setDraft(next)
    setStatus('dirty')
  }
  const editProject = (patch: Partial<Project>) =>
    edit({ ...draft, projects: draft.projects.map((p, i) => (i === active ? { ...p, ...patch } : p)) })
  const editTitles = (allTitles: string[]) => editProject({ allTitles })
  // Details are keyed by title text, so a rename moves them to the new key and a removal drops them.
  const saveTitle = (i: number, title: string, details: WorkDetails) => {
    const { [project.allTitles[i]]: _old, ...rest } = project.details ?? {}
    editProject({
      allTitles: project.allTitles.map((t, j) => (j === i ? title : t)),
      details: Object.keys(details).length ? { ...rest, [title]: details } : rest,
    })
  }
  const removeTitle = (i: number) => {
    const { [project.allTitles[i]]: _old, ...rest } = project.details ?? {}
    editProject({ allTitles: project.allTitles.filter((_, j) => j !== i), details: rest })
  }
  // The numbers are the same in every language; only the labels are translated.
  const editStat = (i: number, value: string) =>
    edit({
      ...draft,
      stats: Object.fromEntries(
        languages.map((lang) => [lang, draft.stats[lang].map((s, j) => (j === i ? { ...s, value } : s))]),
      ) as Content['stats'],
    })
  const editLink = (key: keyof Content['links'], value: string) => edit({ ...draft, links: { ...draft.links, [key]: value } })

  const addProject = () => {
    const title = 'New category'
    const added: Project = {
      slug: `custom-${Date.now()}`,
      category: 'NEW',
      title,
      label: { en: title, ja: title },
      subtitle: { en: '', ja: '' },
      client: 'Client name',
      role: { en: 'Role', ja: 'Role' },
      allTitles: ['Untitled project'],
      wide: false,
    }
    edit({ ...draft, projects: [...draft.projects, added] })
    setActive(draft.projects.length)
  }

  const removeProject = () => {
    edit({ ...draft, projects: draft.projects.filter((_, i) => i !== active) })
    setActive(0)
  }

  const discardRestored = () => {
    setDraft(content)
    setStatus('saved')
    setRestoredAt(null)
  }

  const onHandleKey = (e: KeyboardEvent, i: number) => {
    const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : -1
    if (!e.altKey || to < 0 || to >= project.allTitles.length) return
    e.preventDefault()
    editTitles(move(project.allTitles, i, to))
    // Keep the moved row visible inside the scrolling title frame.
    const handle = e.currentTarget as HTMLElement
    requestAnimationFrame(() => handle.closest('.project-rows')?.children[to]?.scrollIntoView({ block: 'nearest' }))
  }

  // Titles still shown with a bundled poster from assets/projects (no image saved in Supabase yet).
  const bundled = draft.projects.flatMap((p) => p.allTitles.filter((t) => !p.details?.[t]?.image && posterSrc(t)))

  // One-time move of those posters into the `posters` bucket; the URLs land in the draft, published on Save.
  async function moveBundled() {
    setError('')
    const urls = new Map<string, string>()
    for (const [i, title] of bundled.entries()) {
      setMoving(`Moving ${i + 1} / ${bundled.length}…`)
      const key = posterKey(title)
      if (!urls.has(key)) {
        const blob = await fetch(posterSrc(title)!).then((r) => r.blob())
        const result = await uploadPoster(new File([blob], `${key}.jpg`, { type: blob.type }))
        if ('error' in result) {
          setError(`Stopped at "${title}": ${result.error}`)
          break
        }
        urls.set(key, result.url)
      }
    }
    setMoving('')
    if (!urls.size) return
    // Applied to the latest draft, so edits made while uploading are kept.
    setDraft((d) => ({
      ...d,
      projects: d.projects.map((p) => {
        const details = { ...p.details }
        for (const t of p.allTitles) {
          const url = urls.get(posterKey(t))
          if (url && !details[t]?.image) details[t] = { ...details[t], image: url }
        }
        return { ...p, details }
      }),
    }))
    setStatus('dirty')
  }

  async function save() {
    setStatus('saving')
    setError('')
    const message = await saveContent(draft)
    if (message) {
      setError(
        message.includes('schema cache')
          ? 'The "content" table is missing in Supabase. Run supabase/mitigations/01_create_content_table.sql in the Supabase SQL editor, then save again.'
          : AUTH_ERROR.test(message)
            ? 'Your session has ended or this account can’t publish. Sign out and sign in again — your changes are kept in this browser.'
            : message,
      )
      setStatus('dirty')
      return
    }
    onSaved(draft)
    setStatus('saved')
    setRestoredAt(null)
  }

  return (
    <div className="cms-page">
      <aside className="cms-sidebar">
        <a className="cms-brand" href="#/" aria-label="View portfolio">
          {site.brand}<span aria-hidden="true">®</span>
        </a>
        <nav aria-label="CMS sections">
          {sections.map(({ id, label }, i) =>
            id === ENQUIRIES ? (
              <a key={id} href={ENQUIRIES} aria-current={page === 'enquiries' ? 'page' : undefined}>
                <span>{pad(i + 1)}</span> {label}
                {unread > 0 && <b className="cms-badge" aria-label={`${unread} unread`}>{unread}</b>}
              </a>
            ) : (
              // Buttons, not #anchors: an in-page #hash would leave the #/cms route.
              <button
                type="button"
                key={id}
                aria-current={page === 'content' && section === id}
                onClick={() => {
                  setSection(id)
                  if (page === 'content') document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() })
                  else {
                    setPending(id)
                    location.hash = '#/cms'
                  }
                }}
              >
                <span>{pad(i + 1)}</span> {label}
              </button>
            ),
          )}
        </nav>
        <div className="cms-user">
          <span aria-hidden="true">{shortName.map((w) => w[0]).join('')}</span>
          <div>
            <strong>{shortName.join(' ')}</strong>
            <small>Administrator</small>
          </div>
          <button type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button>
        </div>
      </aside>

      <main id="main" className={page === 'enquiries' ? 'cms-main enquiries-main' : 'cms-main'} tabIndex={-1}>
        {page === 'enquiries' ? (
          <CmsEnquiries onUnread={setUnread} />
        ) : (
        <>
        <header className="cms-header">
          <div>
            <p>Content management system</p>
            <h1>Portfolio content</h1>
          </div>
          <div className="cms-header-actions">
            <a href="#/" target="_blank" rel="noopener noreferrer">View site ↗</a>
            <button type="button" className={status === 'saved' ? 'saved' : ''} onClick={save} disabled={status !== 'dirty'}>
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </header>
        {error && <p className="cms-error" role="alert">{error}</p>}
        {bundled.length > 0 && (
          <p className="cms-restored" role="status">
            {moving || `${bundled.length} titles still use built-in posters. Move them to storage so every image is managed here.`}
            <button type="button" disabled={!!moving} onClick={moveBundled}>Move to storage</button>
          </p>
        )}
        {restoredAt && (
          <p className="cms-restored" role="status">
            Restored unsaved changes from {new Date(restoredAt).toLocaleString()}. Save to publish them.
            <button type="button" onClick={discardRestored}>Discard</button>
          </p>
        )}

        <section className="cms-overview" id="cms-profile" aria-label="Profile numbers">
          {draft.stats.en.map((stat, i) => (
            <label key={i}> 
              <span>{stat.label}</span>
              <input value={stat.value} onChange={(e) => editStat(i, e.target.value)} />
            </label>
          ))}
          <label className="cms-client-roster">
            <span>Selected clients</span>
            <input value={draft.clientRoster} onChange={(e) => edit({ ...draft, clientRoster: e.target.value })} />
          </label>
        </section>

        <div className="cms-workspace" id="cms-portfolio">
          <nav className="category-list" aria-label="Work categories">
            <div className="cms-block-heading">
              <p>Work categories</p>
              <button type="button" aria-label="Add category" onClick={addProject}>+</button>
            </div>
            {draft.projects.map((p, i) => (
              <button type="button" key={p.slug} aria-current={i === active} onClick={() => setActive(i)}>
                <span>{pad(i + 1)}</span>
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.allTitles.length} projects</small>
                </span>
                <i aria-hidden="true">›</i>
              </button>
            ))}
          </nav>

          {project ? (
            <section className="cms-editor" aria-labelledby="cms-editing">
              <div className="cms-block-heading">
                <div>
                  <p>Editing category {pad(active + 1)}</p>
                  <h2 id="cms-editing">{project.title}</h2>
                </div>
                <div className="cms-editor-actions">
                  <CmsLangToggle value={lang} onChange={setLang} />
                  <span className={status === 'saved' ? 'status-pill' : 'status-pill is-draft'}>
                    {status === 'saved' ? 'Published' : 'Unsaved'}
                  </span>
                </div>
              </div>

              <div className="editor-fields">
                <label>
                  Category title
                  <input value={project.title} onChange={(e) => editProject({ title: e.target.value })} />
                </label>
                <label>
                  Client
                  <input value={project.client} onChange={(e) => editProject({ client: e.target.value })} />
                </label>
                {/* Translated fields: the EN / JP toggle above picks which language they edit. */}
                <label className="full-field">
                  Role ({langLabel})
                  <input lang={lang} value={project.role[lang]} onChange={(e) => editProject({ role: { ...project.role, [lang]: e.target.value } })} />
                </label>
                <label>
                  Label ({langLabel})
                  <input lang={lang} value={project.label[lang]} onChange={(e) => editProject({ label: { ...project.label, [lang]: e.target.value } })} />
                </label>
                <label>
                  Subtitle ({langLabel})
                  <input lang={lang} value={project.subtitle[lang]} onChange={(e) => editProject({ subtitle: { ...project.subtitle, [lang]: e.target.value } })} />
                </label>
              </div>

              {/* Card tag, width and delete, folded away to keep the design's layout. */}
              <details className="cms-more">
                <summary>Card details</summary>
                <div className="editor-fields">
                  <label>
                    Card tag
                    <input value={project.category} onChange={(e) => editProject({ category: e.target.value })} />
                  </label>
                  <label className="cms-check">
                    <input type="checkbox" checked={project.wide} onChange={(e) => editProject({ wide: e.target.checked })} />
                    Wide card
                  </label>
                  <button type="button" className="cms-danger" onClick={() => setConfirming('category')}>Delete this category</button>
                </div>
              </details>

              <div className="project-editor">
                <div className="cms-block-heading">
                  <div>
                    <p>Project titles</p>
                    <small>Click a title to edit its details. Drag to reorder (or Alt + ↑/↓ on the handle).</small>
                  </div>
                  <button type="button" className="add-project" onClick={() => editTitles([...project.allTitles, 'Untitled project'])}>
                    + Add project
                  </button>
                </div>
                <ol className="project-rows">
                  {project.allTitles.map((work, i) => (
                    <li
                      className={dragged === i ? 'project-row is-dragging' : 'project-row'}
                      key={`${active}-${i}`}
                      draggable
                      onDragStart={() => setDragged(i)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (dragged === null || dragged === i) return
                        editTitles(move(project.allTitles, dragged, i))
                        setDragged(i)
                      }}
                      onDragEnd={() => setDragged(null)}
                    >
                      <button type="button" className="drag-handle" aria-label={`Reorder ${work}: Alt + arrow keys`} onKeyDown={(e) => onHandleKey(e, i)}>
                        ⠿
                      </button>
                      <span className="row-number">{pad(i + 1)}</span>
                      <button type="button" className="project-edit-trigger" onClick={() => setEditing(i)}>
                        <span>{work}</span>
                        <small>{project.details?.[work] ? 'Details added' : 'Add details'}</small>
                      </button>
                      <button type="button" aria-label={`Remove ${work}`} onClick={() => setConfirming({ title: i })}>
                        ×
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              {editing !== null && project.allTitles[editing] !== undefined && (
                <CmsTitleEditor
                  key={`${active}-${editing}`}
                  number={pad(editing + 1)}
                  title={project.allTitles[editing]}
                  details={project.details?.[project.allTitles[editing]]}
                  lang={lang}
                  onLang={setLang}
                  onSave={(title, details) => saveTitle(editing, title, details)}
                  onClose={() => setEditing(null)}
                />
              )}
              {confirming === 'category' && (
                <CmsConfirm
                  kicker="DELETE CATEGORY"
                  heading={`Are you sure you want to delete “${project.title}”?`}
                  detail="This removes the category card and every title, image, summary and link in it. It takes effect when you save changes."
                  confirmLabel="Delete category"
                  onConfirm={removeProject}
                  onClose={() => setConfirming(null)}
                />
              )}
              {confirming !== null && confirming !== 'category' && project.allTitles[confirming.title] !== undefined && (
                <CmsConfirm
                  kicker="DELETE PROJECT"
                  heading={`Are you sure you want to delete “${project.allTitles[confirming.title]}”?`}
                  detail="This removes the title, image, summary, and external link from this category."
                  confirmLabel="Delete project"
                  onConfirm={() => removeTitle(confirming.title)}
                  onClose={() => setConfirming(null)}
                />
              )}
            </section>
          ) : (
            <p className="cms-editor">No categories yet. Add one with +.</p>
          )}
        </div>

        <section className="cms-socials" id="cms-socials" aria-labelledby="cms-socials-heading">
          <div className="cms-block-heading">
            <div>
              <p id="cms-socials-heading">Social media &amp; contact</p>
              <small>Links displayed in the portfolio footer.</small>
            </div>
          </div>
          <div className="editor-fields">
            <label>
              LinkedIn
              <input type="url" value={draft.links.linkedin} onChange={(e) => editLink('linkedin', e.target.value)} />
            </label>
            <label>
              X / Twitter
              <input type="url" value={draft.links.x} onChange={(e) => editLink('x', e.target.value)} />
            </label>
            <label>
              X link text
              <input value={draft.links.xLabel} onChange={(e) => editLink('xLabel', e.target.value)} />
            </label>
            <label>
              Contact email
              <input type="email" placeholder="Add a public email address" value={draft.links.email} onChange={(e) => editLink('email', e.target.value)} />
            </label>
          </div>
        </section>
        </>
        )}
      </main>
    </div>
  )
}
