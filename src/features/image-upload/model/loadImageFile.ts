import { decodeGB7, GB7CodecError } from '../../gb7-codec'
import { detectImageFileFormat } from '../../../entities/image/lib/fileFormat'
import { createFileProcessingError } from '../../../entities/image/lib/errors'
import type {
  DecodedGB7Image,
  EditableImage,
  FileProcessingError,
  ImageFileFormat,
  ImageLoadResult,
  ImageMetadata,
} from '../../../entities/image/types'
import { readBrowserImageData } from '../../image-viewer/lib/canvasUtils'

export async function loadImageFile(file: File): Promise<ImageLoadResult> {
  const format: ImageFileFormat | null = detectImageFileFormat(file)

  if (format === null) {
    return {
      ok: false,
      error: createFileProcessingError(
        'UNSUPPORTED_FORMAT',
        'Unsupported file format. Use PNG, JPG/JPEG or GB7.',
      ),
    }
  }

  try {
    // Модуль загрузки выбирает инфраструктурный путь: браузерный декодер для PNG/JPEG или собственный GB7-кодек.
    const image: EditableImage =
      format === 'gb7' ? await loadGB7Image(file) : await loadBrowserImage(file, format)

    return {
      ok: true,
      image,
    }
  } catch (cause: unknown) {
    return {
      ok: false,
      error: normalizeLoadError(cause),
    }
  }
}

async function loadGB7Image(file: File): Promise<EditableImage> {
  const buffer: ArrayBuffer = await file.arrayBuffer()
  const decoded: DecodedGB7Image = decodeGB7(buffer)

  return {
    imageData: decoded.imageData,
    metadata: {
      ...decoded.metadata,
      fileName: file.name,
      fileSizeBytes: file.size,
    },
  }
}

async function loadBrowserImage(file: File, format: Exclude<ImageFileFormat, 'gb7'>): Promise<EditableImage> {
  const imageData: ImageData = await readBrowserImageData(file)
  // Для браузерных форматов глубина фиксируется на уровне представления: JPEG без альфа-канала, PNG с альфа-каналом.
  const metadata: ImageMetadata = {
    width: imageData.width,
    height: imageData.height,
    colorDepth: format === 'jpeg' ? 24 : 32,
    format,
    colorMode: format === 'jpeg' ? 'rgb' : 'rgba',
    fileName: file.name,
    fileSizeBytes: file.size,
  }

  return {
    imageData,
    metadata,
  }
}

function normalizeLoadError(cause: unknown): FileProcessingError {
  if (cause instanceof GB7CodecError) {
    return createFileProcessingError(cause.code, cause.message, cause)
  }

  if (isFileProcessingError(cause)) {
    return cause
  }

  return createFileProcessingError('UNKNOWN_ERROR', 'Unknown error while loading the image.', cause)
}

function isFileProcessingError(value: unknown): value is FileProcessingError {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<FileProcessingError> = value

  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}
