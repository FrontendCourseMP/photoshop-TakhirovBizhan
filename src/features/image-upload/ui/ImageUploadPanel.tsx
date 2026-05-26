import { useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import type { EditableImage, FileProcessingError } from '../../../entities/image/types'
import { ACCEPTED_IMAGE_INPUT_TYPES } from '../../../shared/constants/fileFormats'
import { loadImageFile } from '../model/loadImageFile'

interface ImageUploadPanelProps {
  readonly onImageLoaded: (image: EditableImage) => void
  readonly onError: (error: FileProcessingError) => void
}

export function ImageUploadPanel({ onImageLoaded, onError }: ImageUploadPanelProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input: HTMLInputElement = event.currentTarget
    const file: File | undefined = input.files?.[0]

    if (file === undefined) {
      return
    }

    setIsLoading(true)

    const result = await loadImageFile(file)

    if (result.ok) {
      onImageLoaded(result.image)
    } else {
      onError(result.error)
    }

    input.value = ''
    setIsLoading(false)
  }

  return (
    <section className="toolbar-section" aria-label="Upload image">
      <label className="file-picker">
        <span className="file-picker__label">{isLoading ? 'Loading...' : 'Open image'}</span>
        <input
          className="file-picker__input"
          type="file"
          accept={ACCEPTED_IMAGE_INPUT_TYPES}
          disabled={isLoading}
          onChange={handleFileChange}
        />
      </label>
      <span className="toolbar-hint">PNG, JPG/JPEG, GB7</span>
    </section>
  )
}
