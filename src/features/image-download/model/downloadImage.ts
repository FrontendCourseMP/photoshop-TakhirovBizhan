import { replaceFileExtension } from '../../../entities/image/lib/fileFormat'
import { createFileProcessingError } from '../../../entities/image/lib/errors'
import type { EditableImage, FileProcessingError, ImageFileFormat } from '../../../entities/image/types'
import { JPEG_EXPORT_QUALITY } from '../../../shared/constants/fileFormats'
import { downloadBlob } from '../../../shared/lib/downloadFile'
import { encodeGB7, GB7CodecError } from '../../gb7-codec'
import { imageDataToBlob } from '../../image-viewer/lib/canvasUtils'

export async function downloadImage(image: EditableImage, format: ImageFileFormat): Promise<void> {
  try {
    // Имя файла пересобирается под выбранный формат, чтобы download не сохранял
    // PNG-данные с расширением JPG или наоборот.
    const fileName: string = replaceFileExtension(image.metadata.fileName, format)

    if (format === 'gb7') {
      // GB7 не поддерживается браузером, поэтому бинарный файл собирается собственным coder.
      const buffer: ArrayBuffer = encodeGB7(image.imageData)
      downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), fileName)
      return
    }

    // Для PNG/JPEG используем стандартный canvas export, как требует задание.
    // JPEG дополнительно получает quality, а PNG сохраняется без потерь.
    const mimeType: 'image/png' | 'image/jpeg' = format === 'png' ? 'image/png' : 'image/jpeg'
    const blob: Blob = await imageDataToBlob(
      image.imageData,
      mimeType,
      format === 'jpeg' ? JPEG_EXPORT_QUALITY : undefined,
    )

    downloadBlob(blob, fileName)
  } catch (cause: unknown) {
    throw normalizeDownloadError(cause)
  }
}

function normalizeDownloadError(cause: unknown): FileProcessingError {
  // Ошибки codec и canvas export приводятся к одному типу, чтобы UI мог
  // показывать их через общий error banner.
  if (cause instanceof GB7CodecError) {
    return createFileProcessingError(cause.code, cause.message, cause)
  }

  if (isFileProcessingError(cause)) {
    return cause
  }

  return createFileProcessingError('UNKNOWN_ERROR', 'Unknown error while exporting the image.', cause)
}

function isFileProcessingError(value: unknown): value is FileProcessingError {
  // Проверка по форме объекта нужна для безопасной работы с unknown.
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<FileProcessingError> = value

  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}
