import type { JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'

interface ImageDropZoneProps {
  readonly isDragActive: boolean
  readonly isLoading: boolean
  readonly onOpenClick: () => void
}

export function ImageDropZone({ isDragActive, isLoading, onOpenClick }: ImageDropZoneProps): JSX.Element {
  return (
    <div className={isDragActive ? 'dropzone dropzone--active' : 'dropzone'}>
      <span className="dropzone__icon">
        <Icon name="image" size={28} />
      </span>
      <p className="dropzone__title">{isDragActive ? 'Drop the file to open it' : 'Drag an image here'}</p>
      <button className="btn btn--primary" type="button" disabled={isLoading} onClick={onOpenClick}>
        <Icon name="open" />
        <span>{isLoading ? 'Loading…' : 'Choose a file'}</span>
      </button>
      <p className="dropzone__hint">PNG · JPG / JPEG · GB7</p>
    </div>
  )
}
