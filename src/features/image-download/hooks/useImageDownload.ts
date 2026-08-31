import { useState } from 'react'
import type { EditableImage, FileProcessingError, ImageFileFormat } from '../../../entities/image/types'
import { downloadImage } from '../model/downloadImage'

interface UseImageDownloadOptions {
  readonly onError: (error: FileProcessingError) => void
}

export interface UseImageDownloadResult {
  readonly isExporting: boolean
  readonly exportImage: (image: EditableImage, format: ImageFileFormat) => void
}

export function useImageDownload({ onError }: UseImageDownloadOptions): UseImageDownloadResult {
  const [isExporting, setIsExporting] = useState<boolean>(false)

  async function runExport(image: EditableImage, format: ImageFileFormat): Promise<void> {
    // Флаг блокирует параллельные экспорты: кодирование большого изображения занимает время,
    // а браузер должен получить один Blob на одно действие пользователя.
    setIsExporting(true)

    try {
      await downloadImage(image, format)
    } catch (cause: unknown) {
      onError(normalizeExportError(cause))
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportImage: (image: EditableImage, format: ImageFileFormat): void => {
      if (isExporting) {
        return
      }

      void runExport(image, format)
    },
  }
}

function normalizeExportError(cause: unknown): FileProcessingError {
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
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<FileProcessingError> = value

  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}
