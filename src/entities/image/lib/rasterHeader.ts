import type { ImageColorMode, ImageFileFormat } from '../types'

/**
 * Разбор заголовков растровых файлов: формат и число бит на пиксель.
 * Пиксельные данные модуль не читает.
 */
export interface RasterPixelFormat {
  readonly colorDepth: number
  readonly colorMode: ImageColorMode
}

// Формат опознается по первым байтам файла, а не по расширению.
const PNG_MAGIC: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_MAGIC: readonly number[] = [0xff, 0xd8, 0xff]
const GB7_MAGIC: readonly number[] = [0x47, 0x42, 0x37, 0x1d]

// IHDR идет первым чанком PNG: 8 байт сигнатуры + 4 байта длины + 4 байта имени.
const PNG_CHUNK_NAME_OFFSET = 12
const PNG_IHDR_DATA_OFFSET = 16
const PNG_BITS_PER_SAMPLE_OFFSET = PNG_IHDR_DATA_OFFSET + 8
const PNG_COLOR_TYPE_OFFSET = PNG_IHDR_DATA_OFFSET + 9

const JPEG_MARKER_PREFIX = 0xff
const JPEG_SEGMENT_START = 2
const JPEG_MIN_SEGMENT_LENGTH = 2

export function detectRasterFormat(head: Uint8Array): ImageFileFormat | null {
  if (startsWith(head, GB7_MAGIC)) {
    return 'gb7'
  }

  if (startsWith(head, PNG_MAGIC)) {
    return 'png'
  }

  if (startsWith(head, JPEG_MAGIC)) {
    return 'jpeg'
  }

  return null
}

/**
 * Возвращает глубину цвета из заголовка или null, если разобрать его не удалось.
 */
export function readRasterPixelFormat(head: Uint8Array, format: ImageFileFormat): RasterPixelFormat | null {
  if (format === 'png') {
    return readPngPixelFormat(head)
  }

  if (format === 'jpeg') {
    return readJpegPixelFormat(head)
  }

  return null
}

function readPngPixelFormat(head: Uint8Array): RasterPixelFormat | null {
  if (head.length <= PNG_COLOR_TYPE_OFFSET) {
    return null
  }

  // Смещения ниже верны только для IHDR, поэтому имя чанка проверяется заранее.
  if (readAsciiTag(head, PNG_CHUNK_NAME_OFFSET, 4) !== 'IHDR') {
    return null
  }

  const bitsPerSample: number = head[PNG_BITS_PER_SAMPLE_OFFSET]
  const samplesPerPixel: number | null = getPngSamplesPerPixel(head[PNG_COLOR_TYPE_OFFSET])
  const colorMode: ImageColorMode | null = getPngColorMode(head[PNG_COLOR_TYPE_OFFSET])

  if (bitsPerSample <= 0 || samplesPerPixel === null || colorMode === null) {
    return null
  }

  return {
    colorDepth: bitsPerSample * samplesPerPixel,
    colorMode,
  }
}

function getPngSamplesPerPixel(colorType: number): number | null {
  // Палитровый PNG хранит на пиксель индекс, то есть один образец.
  switch (colorType) {
    case 0:
      return 1
    case 2:
      return 3
    case 3:
      return 1
    case 4:
      return 2
    case 6:
      return 4
    default:
      return null
  }
}

function getPngColorMode(colorType: number): ImageColorMode | null {
  switch (colorType) {
    case 0:
    case 4:
      return 'grayscale'
    case 2:
    case 3:
      return 'rgb'
    case 6:
      return 'rgba'
    default:
      return null
  }
}

function readJpegPixelFormat(head: Uint8Array): RasterPixelFormat | null {
  let cursor: number = JPEG_SEGMENT_START

  // Сегменты JPEG имеют переменную длину, поэтому кадр SOF ищется перебором маркеров.
  while (cursor + 1 < head.length) {
    if (head[cursor] !== JPEG_MARKER_PREFIX) {
      cursor += 1
      continue
    }

    const marker: number = head[cursor + 1]

    // Подряд идущие 0xFF - выравнивание, а не новый сегмент.
    if (marker === JPEG_MARKER_PREFIX) {
      cursor += 1
      continue
    }

    if (isStandaloneJpegMarker(marker)) {
      cursor += 2
      continue
    }

    if (cursor + 3 >= head.length) {
      return null
    }

    const segmentLength: number = readUint16BigEndian(head, cursor + 2)

    if (segmentLength < JPEG_MIN_SEGMENT_LENGTH) {
      return null
    }

    if (isJpegFrameMarker(marker)) {
      return readJpegFrame(head, cursor)
    }

    cursor += 2 + segmentLength
  }

  return null
}

function readJpegFrame(head: Uint8Array, segmentOffset: number): RasterPixelFormat | null {
  // Раскладка кадра: маркер, длина сегмента, точность, высота, ширина, число компонент.
  const precisionOffset: number = segmentOffset + 4
  const componentCountOffset: number = segmentOffset + 9

  if (componentCountOffset >= head.length) {
    return null
  }

  const bitsPerSample: number = head[precisionOffset]
  const componentCount: number = head[componentCountOffset]

  if (bitsPerSample <= 0 || componentCount <= 0) {
    return null
  }

  // Alpha в JPEG нет: одна компонента - оттенки серого, больше - цвет.
  return {
    colorDepth: bitsPerSample * componentCount,
    colorMode: componentCount === 1 ? 'grayscale' : 'rgb',
  }
}

function isStandaloneJpegMarker(marker: number): boolean {
  // Маркеры начала и конца потока, а также рестарт-маркеры не имеют поля длины.
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)
}

function isJpegFrameMarker(marker: number): boolean {
  // Кадр описывают маркеры SOF0..SOF15, кроме занятых под таблицы.
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
}

function startsWith(head: Uint8Array, magic: readonly number[]): boolean {
  if (head.length < magic.length) {
    return false
  }

  for (let index = 0; index < magic.length; index += 1) {
    if (head[index] !== magic[index]) {
      return false
    }
  }

  return true
}

function readAsciiTag(head: Uint8Array, offset: number, length: number): string {
  let tag = ''

  for (let index = 0; index < length; index += 1) {
    tag += String.fromCharCode(head[offset + index])
  }

  return tag
}

function readUint16BigEndian(head: Uint8Array, offset: number): number {
  return (head[offset] << 8) | head[offset + 1]
}
