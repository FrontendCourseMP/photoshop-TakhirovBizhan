import { decodeGB7, GB7CodecError } from '../../gb7-codec'
import { detectImageFileFormat } from '../../../entities/image/lib/fileFormat'
import { detectRasterFormat, readRasterPixelFormat } from '../../../entities/image/lib/rasterHeader'
import type { RasterPixelFormat } from '../../../entities/image/lib/rasterHeader'
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

type BrowserImageFormat = Exclude<ImageFileFormat, 'gb7'>

// Для разбора заголовка достаточно начала файла; целиком читается только GB7.
const HEADER_PROBE_BYTES = 128 * 1024

// Используются, когда заголовок разобрать не удалось, а браузер файл декодировал.
const FALLBACK_PIXEL_FORMATS: Readonly<Record<BrowserImageFormat, RasterPixelFormat>> = {
  png: { colorDepth: 32, colorMode: 'rgba', hasAlpha: true },
  jpeg: { colorDepth: 24, colorMode: 'rgb', hasAlpha: false },
}

export async function loadImageFile(file: File): Promise<ImageLoadResult> {
  try {
    // Формат берется из содержимого файла, потому что расширение может не совпадать с данными.
    const head: Uint8Array = new Uint8Array(await file.slice(0, HEADER_PROBE_BYTES).arrayBuffer())
    // Расширение - запасной вариант: битый GB7 так попадет в свой декодер и вернет точную ошибку.
    const format: ImageFileFormat | null = detectRasterFormat(head) ?? detectImageFileFormat(file)

    if (format === null) {
      return {
        ok: false,
        error: createFileProcessingError(
          'UNSUPPORTED_FORMAT',
          'Unsupported file format. Use PNG, JPG/JPEG or GB7.',
        ),
      }
    }

    // Модуль загрузки выбирает инфраструктурный путь: браузерный decoder для PNG/JPEG
    // или собственный GB7 codec
    const image: EditableImage =
      format === 'gb7' ? await loadGB7Image(file) : await loadBrowserImage(file, format, head)

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
  // GB7 читается как бинарный ArrayBuffer, потому что формат хранит header и пиксели
  // в собственном byte layout, недоступном через HTMLImageElement.
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

async function loadBrowserImage(
  file: File,
  format: BrowserImageFormat,
  head: Uint8Array,
): Promise<EditableImage> {
  const imageData: ImageData = await readBrowserImageData(file)
  // Canvas всегда отдает RGBA, поэтому исходная глубина берется из заголовка файла.
  const pixelFormat: RasterPixelFormat = readRasterPixelFormat(head, format) ?? FALLBACK_PIXEL_FORMATS[format]
  const metadata: ImageMetadata = {
    width: imageData.width,
    height: imageData.height,
    colorDepth: pixelFormat.colorDepth,
    format,
    colorMode: pixelFormat.colorMode,
    hasAlpha: pixelFormat.hasAlpha,
    fileName: file.name,
    fileSizeBytes: file.size,
  }

  return {
    imageData,
    metadata,
  }
}

function normalizeLoadError(cause: unknown): FileProcessingError {
  // Наружу feature возвращает единый FileProcessingError независимо от того,
  // где возникла ошибка: в GB7 codec, canvas decoder или другом месте.
  if (cause instanceof GB7CodecError) {
    return createFileProcessingError(cause.code, cause.message, cause)
  }

  if (isFileProcessingError(cause)) {
    return cause
  }

  return createFileProcessingError('UNKNOWN_ERROR', 'Unknown error while loading the image.', cause)
}

function isFileProcessingError(value: unknown): value is FileProcessingError {
  // unknown безопасно сужается по минимальному контракту ошибки, без any и unsafe cast.
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<FileProcessingError> = value

  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}
