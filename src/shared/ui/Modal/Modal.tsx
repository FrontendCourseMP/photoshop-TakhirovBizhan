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
    // Native <dialog> управляется императивно: React передает open,
    // а showModal/close синхронизируют реальное состояние DOM-элемента.
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
    // Закрытый modal не рендерится, чтобы внутри него не оставались активные inputs/effects.
    return null
  }

  return (
    <dialog
      className="modal-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        // Escape должен проходить через onClose, чтобы feature успела сбросить preview/snapshot.
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
