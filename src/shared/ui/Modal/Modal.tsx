import { useEffect, useRef } from 'react'
import type { JSX, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { Icon } from '../Icon'

type ModalSize = 'md' | 'lg'

interface ModalProps {
  readonly open: boolean
  readonly title: string
  readonly subtitle?: string
  readonly size?: ModalSize
  readonly children: ReactNode
  readonly onClose: () => void
}

export function Modal({ open, title, subtitle, size = 'md', children, onClose }: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const isBackdropPressRef = useRef<boolean>(false)

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

  function handleDialogMouseDown(event: ReactMouseEvent<HTMLDialogElement>): void {
    isBackdropPressRef.current = event.target === event.currentTarget
  }

  function handleDialogClick(event: ReactMouseEvent<HTMLDialogElement>): void {
    // Контент занимает всю площадь dialog, поэтому попадание в сам элемент означает клик по backdrop.
    // Нажатие тоже должно начаться на backdrop: иначе перетаскивание ползунка с отпусканием
    // за границей окна давало бы click по dialog и закрывало инструмент.
    if (event.target === event.currentTarget && isBackdropPressRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      className={size === 'lg' ? 'dialog dialog--lg' : 'dialog'}
      ref={dialogRef}
      onClick={handleDialogClick}
      onMouseDown={handleDialogMouseDown}
      onCancel={(event) => {
        // Escape должен проходить через onClose, чтобы feature успела сбросить preview/snapshot.
        event.preventDefault()
        onClose()
      }}
    >
      <div className="dialog__panel">
        <header className="dialog__header">
          <div className="dialog__heading">
            <h2>{title}</h2>
            {subtitle === undefined ? null : <p>{subtitle}</p>}
          </div>
          <button className="btn btn--icon btn--ghost" aria-label="Close dialog" type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="dialog__body">{children}</div>
      </div>
    </dialog>
  )
}
