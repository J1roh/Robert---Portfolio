import { useEffect, useState } from 'react'
import { DELETED_DAYS, loadEnquiries, updateEnquiry, type Enquiry, type EnquiryStatus } from '../lib/enquiries.ts'
import { formatEnquiryDate } from '../lib/enquiry-date.ts'
import Arrow from '../components/Arrow.tsx'

// CMS Enquiries page (#/cms/enquiries), after the owner's design: Inbox / Archive / Recently deleted folders,
// a message list and a reading pane. Only signed-in CMS users can read or change enquiries (RLS, mitigations/12).
const folders: { status: EnquiryStatus; label: string; heading: string }[] = [
  { status: 'inbox', label: 'Inbox', heading: 'Inbox messages' },
  { status: 'archived', label: 'Archive', heading: 'Archived messages' },
  { status: 'deleted', label: 'Recently deleted', heading: `Deleted in the last ${DELETED_DAYS} days` },
]
const pad = (n: number) => String(n).padStart(2, '0')

// onUnread keeps the sidebar badge in step as messages are read or moved here.
export default function CmsEnquiries({ onUnread }: { onUnread: (count: number) => void }) {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null)
  const [folder, setFolder] = useState<EnquiryStatus>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reload = () => {
    loadEnquiries().then((result) => {
      setEnquiries(result.enquiries)
      setError(result.error ?? '')
      setLoading(false)
    })
  }

  // New submissions show up when coming back to the tab, without a full page reload.
  useEffect(() => {
    reload()
    addEventListener('focus', reload)
    return () => removeEventListener('focus', reload)
  }, [])

  const all = enquiries ?? []
  const visible = all.filter((e) => e.status === folder)
  const selected = visible.find((e) => e.id === selectedId) ?? visible[0]
  const unread = all.filter((e) => !e.read && e.status !== 'deleted').length

  useEffect(() => {
    if (enquiries) onUnread(unread)
  }, [enquiries, unread, onUnread])

  // Optimistic: the UI changes at once; a failed save shows the error and restores the old row.
  async function update(enquiry: Enquiry, patch: Partial<Pick<Enquiry, 'read' | 'status' | 'deleted_at'>>) {
    setEnquiries((list) => list?.map((e) => (e.id === enquiry.id ? { ...e, ...patch } : e)) ?? null)
    const message = await updateEnquiry(enquiry.id, patch)
    if (!message) return
    setError(message)
    setEnquiries((list) => list?.map((e) => (e.id === enquiry.id ? enquiry : e)) ?? null)
  }

  const select = (enquiry: Enquiry) => {
    setSelectedId(enquiry.id)
    if (!enquiry.read) update(enquiry, { read: true })
  }

  // After moving a message out of this folder, open the next one in it.
  const move = (enquiry: Enquiry, status: EnquiryStatus) => {
    update(enquiry, { status, deleted_at: status === 'deleted' ? new Date().toISOString() : null })
    setSelectedId(visible.find((e) => e.id !== enquiry.id)?.id ?? null)
  }

  return (
    <>
      <header className="cms-header">
        <div>
          <p>Contact management</p>
          <h1>Enquiries</h1>
        </div>
        <div className="enquiry-header-actions">
          <button type="button" className="enquiry-refresh" onClick={() => {
              setLoading(true)
              reload()
            }} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <div className="enquiry-summary">
            <span>{unread}</span>
            unread
          </div>
        </div>
      </header>
      {error && <p className="cms-error" role="alert">{error}</p>}

      <div className="enquiry-tabs" role="group" aria-label="Enquiry folders">
        {folders.map((f) => (
          <button type="button" key={f.status} aria-pressed={folder === f.status} onClick={() => setFolder(f.status)}>
            {f.label} <span>{all.filter((e) => e.status === f.status).length}</span>
          </button>
        ))}
      </div>

      <div className="enquiry-workspace">
        <div className="enquiry-list">
          <div className="enquiry-list-heading">
            <p>{folders.find((f) => f.status === folder)?.heading}</p>
            <span>{pad(visible.length)}</span>
          </div>
          {enquiries === null ? (
            <div className="empty-enquiries">
              <p>Loading…</p>
            </div>
          ) : visible.length ? (
            visible.map((e) => (
              <button
                type="button"
                key={e.id}
                className={[selected?.id === e.id && 'active', !e.read && 'unread'].filter(Boolean).join(' ')}
                aria-current={selected?.id === e.id}
                onClick={() => select(e)}
              >
                <i aria-hidden="true" />
                <div>
                  <div className="enquiry-sender">
                    <strong>
                      {e.name}
                      {!e.read && <span className="visually-hidden"> (unread)</span>}
                    </strong>
                    <time dateTime={e.created_at}>{formatEnquiryDate(e.created_at)}</time>
                  </div>
                  <p>{e.company || '—'}</p>
                  {e.service && <span>{e.service}</span>}
                </div>
              </button>
            ))
          ) : (
            <div className="empty-enquiries">
              <strong>Nothing here</strong>
              <p>This folder is currently empty.</p>
            </div>
          )}
        </div>

        <article className="enquiry-detail" aria-label="Selected enquiry">
          {selected ? (
            <>
              <div className="enquiry-actions">
                {folder === 'deleted' ? (
                  <button type="button" onClick={() => move(selected, 'inbox')}>↶ Restore</button>
                ) : (
                  <>
                    <button type="button" onClick={() => update(selected, { read: !selected.read })}>
                      {selected.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    {folder === 'inbox' ? (
                      <button type="button" onClick={() => move(selected, 'archived')}>Archive</button>
                    ) : (
                      <button type="button" onClick={() => move(selected, 'inbox')}>Move to inbox</button>
                    )}
                    <button type="button" className="delete-action" onClick={() => move(selected, 'deleted')}>Delete</button>
                  </>
                )}
              </div>
              <div className="enquiry-detail-body">
                {selected.service && <p className="enquiry-service">{selected.service}</p>}
                <h2>{selected.name}</h2>
                <div className="enquiry-contact-meta">
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  {selected.company && <span>{selected.company}</span>}
                  {selected.timeline && <span>Timeline: {selected.timeline}</span>}
                  <time dateTime={selected.created_at}>{formatEnquiryDate(selected.created_at)}</time>
                </div>
                <p className="enquiry-message">{selected.message}</p>
                <a className="reply-button" href={`mailto:${selected.email}`}>
                  Reply by email <Arrow />
                </a>
              </div>
            </>
          ) : (
            <div className="empty-enquiries detail-empty">
              <strong>Select an enquiry</strong>
              <p>Choose a message from the list to read it.</p>
            </div>
          )}
        </article>
      </div>
    </>
  )
}
