import { useEffect, useRef } from 'react'
import type { JSX, ReactNode } from 'react'

interface ModalProps {
  readonly open: boolean
  readonly title: string
  readonly children: ReactNode
  readonly onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect((): void => {
    const dialog: HTMLDialogElement | null = dialogRef.current

    if (dialog === null) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <dialog
      className="modal-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="modal-dialog__content">
        <header className="modal-dialog__header">
          <h2>{title}</h2>
          <button aria-label="Close dialog" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
