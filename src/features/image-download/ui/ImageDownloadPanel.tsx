import { useState } from 'react'
import type { JSX } from 'react'
import type { EditableImage, FileProcessingError, ImageFileFormat } from '../../../entities/image/types'
import { downloadImage } from '../model/downloadImage'

interface ImageDownloadPanelProps {
  readonly image: EditableImage | null
  readonly onError: (error: FileProcessingError) => void
}

const exportFormats: readonly ImageFileFormat[] = ['png', 'jpeg', 'gb7']

export function ImageDownloadPanel({ image, onError }: ImageDownloadPanelProps): JSX.Element {
  const [activeFormat, setActiveFormat] = useState<ImageFileFormat | null>(null)

  async function handleDownload(format: ImageFileFormat): Promise<void> {
    // При отсутствии изображения кнопки disabled, но guard оставлен для безопасного вызова handler.
    if (image === null) {
      return
    }

    // activeFormat блокирует параллельные экспорты и показывает пользователю текущий формат сохранения.
    setActiveFormat(format)

    try {
      await downloadImage(image, format)
    } catch (cause: unknown) {
      onError(normalizeError(cause))
    } finally {
      setActiveFormat(null)
    }
  }

  return (
    <section className="toolbar-section" aria-label="Download image">
      <div className="button-group" role="group" aria-label="Export formats">
        {exportFormats.map((format: ImageFileFormat) => (
          <button
            className="toolbar-button"
            type="button"
            disabled={image === null || activeFormat !== null}
            key={format}
            onClick={() => {
              void handleDownload(format)
            }}
          >
            {activeFormat === format ? 'Saving...' : `Save ${format.toUpperCase()}`}
          </button>
        ))}
      </div>
    </section>
  )
}

function normalizeError(cause: unknown): FileProcessingError {
  // UI принимает только FileProcessingError, поэтому неизвестные исключения
  // приводятся к единому отображаемому контракту.
  if (isFileProcessingError(cause)) {
    return cause
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error while exporting the image.',
    cause,
  }
}

function isFileProcessingError(value: unknown): value is FileProcessingError {
  // Narrowing по форме объекта позволяет обработать unknown без any.
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<FileProcessingError> = value

  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}
