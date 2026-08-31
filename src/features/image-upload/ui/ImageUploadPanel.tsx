import type { JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import type { UseImageUploadResult } from '../hooks/useImageUpload'

interface ImageUploadPanelProps {
  readonly upload: UseImageUploadResult
}

export function ImageUploadPanel({ upload }: ImageUploadPanelProps): JSX.Element {
  return (
    <button
      className="btn"
      type="button"
      disabled={upload.isLoading}
      title="Open image"
      onClick={upload.openFileDialog}
    >
      <Icon name="open" />
      <span>{upload.isLoading ? 'Loading…' : 'Open'}</span>
    </button>
  )
}
