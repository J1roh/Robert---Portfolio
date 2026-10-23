import { useEffect, useRef, useState } from 'react'
import { uploadPoster, type Language, type WorkDetails } from '../lib/content.ts'
import { posterSrc } from '../lib/posters.ts'
import { embedUrl } from '../lib/video-embed.ts'
import CmsLangToggle from './CmsLangToggle.tsx'

type Props = {
  number: string
  title: string
  details: WorkDetails | undefined
  categoryClient: string
  categoryRole: string
  lang: Language
  onLang: (lang: Language) => void
  onSave: (title: string, details: WorkDetails) => void
  onClose: () => void
}

// "Edit project" modal, copied from the owner's Figma Make zip (v2). Edits a local copy;
// Save project hands it to the CMS draft, which still needs "Save changes" to publish.
export default function CmsTitleEditor({ number, title, details, categoryClient, categoryRole, lang, onLang, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [draftTitle, setDraftTitle] = useState(title)
  const [jaTitle, setJaTitle] = useState(details?.jaTitle ?? '')
  const [client, setClient] = useState(details?.client ?? { en: '', ja: '' })
  const [role, setRole] = useState(details?.role ?? { en: '', ja: '' })
  const [summary, setSummary] = useState(details?.summary ?? { en: '', ja: '' })
  const [link, setLink] = useState(details?.link ?? '')
  const [image, setImage] = useState(details?.image ?? '')
  const [video, setVideo] = useState(details?.video ?? '')
  const [videoFirst, setVideoFirst] = useState(details?.videoFirst ?? false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const shown = image || posterSrc(draftTitle)

  useEffect(() => ref.current?.showModal(), [])

  async function upload(file: File) {
    setUploading(true)
    setError('')
    const result = await uploadPoster(file)
    setUploading(false)
    if ('error' in result) setError(result.error)
    else setImage(result.url)
  }

  function save() {
    onSave(draftTitle.trim() || title, {
      ...(jaTitle.trim() ? { jaTitle: jaTitle.trim() } : {}),
      ...(client.en || client.ja ? { client } : {}),
      ...(role.en || role.ja ? { role } : {}),
      ...(summary.en || summary.ja ? { summary } : {}),
      ...(link ? { link } : {}),
      ...(image ? { image } : {}),
      ...(video ? { video } : {}),
      ...(video && videoFirst ? { videoFirst } : {}),
    })
    ref.current?.close()
  }

  return (
    <dialog ref={ref} className="cms-project-modal" aria-labelledby="cms-edit-title" onClose={onClose}>
      <div className="cms-project-modal-card">
        <div className="cms-project-modal-header">
          <div>
            <p>EDIT PROJECT / {number}</p>
            <h2 id="cms-edit-title">{draftTitle || title}</h2>
          </div>
          <div className="cms-project-modal-actions">
            <CmsLangToggle value={lang} onChange={onLang} />
            <button type="button" aria-label="Close editor" onClick={() => ref.current?.close()}>×</button>
          </div>
        </div>
        <div className="cms-project-modal-body">
          <label className={shown ? 'modal-image-editor has-image' : 'modal-image-editor'}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            {shown ? (
              <>
                <img src={shown} alt="" />
                <span>{uploading ? 'Uploading…' : 'Replace image'}</span>
              </>
            ) : (
              <div>
                <strong>+</strong>
                <span>{uploading ? 'Uploading…' : 'Add project image'}</span>
                <small>JPG, PNG or WebP</small>
              </div>
            )}
          </label>
          <div className="modal-project-fields">
            <label>
              Project title ({lang === 'ja' ? 'JP' : 'EN'})
              {lang === 'ja' ? (
                <input lang="ja" value={jaTitle} placeholder={draftTitle} onChange={(e) => setJaTitle(e.target.value)} />
              ) : (
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
              )}
            </label>
            <label>
              Client ({lang === 'ja' ? 'JP' : 'EN'})
              <input lang={lang} value={client[lang]} placeholder={categoryClient} onChange={(e) => setClient({ ...client, [lang]: e.target.value })} />
            </label>
            <label>
              Role ({lang === 'ja' ? 'JP' : 'EN'})
              <input lang={lang} value={role[lang]} placeholder={categoryRole} onChange={(e) => setRole({ ...role, [lang]: e.target.value })} />
            </label>
            <label>
              Short description ({lang === 'ja' ? 'JP' : 'EN'})
              <textarea
                rows={5}
                lang={lang}
                value={summary[lang]}
                placeholder={lang === 'ja' ? '公開ページのモーダルに表示する短い説明' : 'Add a short summary shown in the public project modal.'}
                onChange={(e) => setSummary({ ...summary, [lang]: e.target.value })}
              />
            </label>
            <label>
              External link
              <input type="url" value={link} placeholder="https://youtube.com/..." onChange={(e) => setLink(e.target.value)} />
            </label>
            <label>
              Video (YouTube or Vimeo)
              <input type="url" value={video} placeholder="https://youtu.be/..." onChange={(e) => setVideo(e.target.value)} />
            </label>
            {video && !embedUrl(video) && <p className="cms-error" role="alert">This link can't be played in the modal. Use a YouTube or Vimeo video link.</p>}
            {video && shown && (
              <label className="modal-check">
                <input type="checkbox" checked={videoFirst} onChange={(e) => setVideoFirst(e.target.checked)} />
                Show the video first (the image becomes the second slide)
              </label>
            )}
            {image && (
              <button type="button" className="modal-image-reset" onClick={() => setImage('')}>
                Use the bundled poster instead
              </button>
            )}
            {error && <p className="cms-error" role="alert">{error}</p>}
          </div>
        </div>
        <div className="cms-project-modal-footer">
          <button type="button" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="button" className="save-project" disabled={uploading} onClick={save}>Save project</button>
        </div>
      </div>
    </dialog>
  )
}
