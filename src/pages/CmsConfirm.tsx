import { useEffect, useRef } from 'react'

type Props = {
  kicker: string
  heading: string
  detail: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

// Delete confirmation, copied from the owner's Figma Make zip (v2 `confirm-modal`).
// Native <dialog>: Esc and Cancel close it, and focus starts on Cancel so Enter never deletes by accident.
export default function CmsConfirm({ kicker, heading, detail, confirmLabel, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="confirm-modal" aria-labelledby="confirm-title" onClose={onClose}>
      <div className="confirm-modal-card">
        <p>{kicker}</p>
        <h2 id="confirm-title">{heading}</h2>
        <span>{detail}</span>
        <div>
          <button type="button" autoFocus onClick={() => ref.current?.close()}>Cancel</button>
          <button
            type="button"
            className="confirm-delete"
            onClick={() => {
              onConfirm()
              ref.current?.close()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
