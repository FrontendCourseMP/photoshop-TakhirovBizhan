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
    // UI-слой только получает File из input и передает его в model.
    // Декодирование PNG/JPEG/GB7 и нормализация ошибок находятся вне компонента.
    const input: HTMLInputElement = event.currentTarget
    const file: File | undefined = input.files?.[0]

    if (file === undefined) {
      return
    }

    setIsLoading(true)

    const result = await loadImageFile(file)

    if (result.ok) {
      // Успешный результат передается page-слою как EditableImage с ImageData и metadata.
      onImageLoaded(result.image)
    } else {
      onError(result.error)
    }

    // Сбрасываем value, чтобы повторный выбор того же файла снова вызвал onChange.
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
