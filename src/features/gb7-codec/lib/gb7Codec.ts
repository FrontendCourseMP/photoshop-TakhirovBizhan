import type { DecodedGB7Image, GB7EncodeOptions } from '../../../entities/image/types'
import { GB7CodecError } from './gb7Errors'

const GB7_SIGNATURE: readonly number[] = [0x47, 0x42, 0x37, 0x1d]
const GB7_VERSION = 0x01
const GB7_HEADER_SIZE = 12
const GB7_MASK_FLAG = 0x01
const GB7_ALLOWED_FLAGS = GB7_MASK_FLAG
const GB7_MAX_DIMENSION = 0xffff
const MAX_GRAYSCALE_7 = 0x7f
const DEFAULT_ALPHA_MASK_THRESHOLD = 127

export function decodeGB7(buffer: ArrayBuffer): DecodedGB7Image {
  // Header занимает ровно 12 байт, после него идет width * height байт пиксельных данных.
  if (buffer.byteLength < GB7_HEADER_SIZE) {
    throw new GB7CodecError('GB7_INVALID_FILE_SIZE', 'GB7 file is smaller than the 12-byte header.')
  }

  const bytes: Uint8Array = new Uint8Array(buffer)

  // Сигнатура защищает декодер от попытки прочитать произвольный файл как GB7.
  validateSignature(bytes)

  if (bytes[4] !== GB7_VERSION) {
    throw new GB7CodecError('GB7_UNSUPPORTED_VERSION', `Unsupported GB7 version: ${bytes[4]}.`)
  }

  const flags: number = bytes[5]

  if ((flags & ~GB7_ALLOWED_FLAGS) !== 0) {
    throw new GB7CodecError('GB7_INVALID_FLAGS', `Unsupported GB7 flags: ${flags}.`)
  }

  const width: number = readUint16BigEndian(bytes, 6)
  const height: number = readUint16BigEndian(bytes, 8)

  if (width === 0 || height === 0) {
    throw new GB7CodecError('GB7_INVALID_DIMENSIONS', 'GB7 width and height must be greater than zero.')
  }

  if (bytes[10] !== 0x00 || bytes[11] !== 0x00) {
    throw new GB7CodecError('GB7_INVALID_RESERVED_BYTES', 'GB7 reserved bytes must be 0x0000.')
  }

  const expectedSize: number = GB7_HEADER_SIZE + width * height

  if (buffer.byteLength !== expectedSize) {
    throw new GB7CodecError(
      'GB7_INVALID_FILE_SIZE',
      `Invalid GB7 file size: expected ${expectedSize} bytes, got ${buffer.byteLength}.`,
    )
  }

  const hasMask: boolean = (flags & GB7_MASK_FLAG) !== 0
  const rgbaBuffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
  const rgba: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(rgbaBuffer)

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const sourceByte: number = bytes[GB7_HEADER_SIZE + pixelIndex]
    const grayscale7: number = sourceByte & MAX_GRAYSCALE_7
    // GB7 хранит 7-битную яркость, а canvas ожидает стандартные 8-битные RGBA-каналы.
    const grayscale8: number = Math.round((grayscale7 / MAX_GRAYSCALE_7) * 255)
    const isMasked: boolean = hasMask && (sourceByte & 0x80) !== 0
    const rgbaOffset: number = pixelIndex * 4

    rgba[rgbaOffset] = grayscale8
    rgba[rgbaOffset + 1] = grayscale8
    rgba[rgbaOffset + 2] = grayscale8
    rgba[rgbaOffset + 3] = isMasked ? 0 : 255
  }

  return {
    imageData: new ImageData(rgba, width, height),
    metadata: {
      width,
      height,
      colorDepth: hasMask ? 8 : 7,
      format: 'gb7',
      colorMode: 'grayscale',
      fileName: '',
      fileSizeBytes: buffer.byteLength,
      hasMask,
    },
  }
}

export function encodeGB7(imageData: ImageData, options: GB7EncodeOptions = {}): ArrayBuffer {
  const width: number = imageData.width
  const height: number = imageData.height

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new GB7CodecError('GB7_INVALID_DIMENSIONS', 'ImageData width and height must be greater than zero.')
  }

  if (width > GB7_MAX_DIMENSION || height > GB7_MAX_DIMENSION) {
    throw new GB7CodecError('GB7_INVALID_DIMENSIONS', 'GB7 supports dimensions up to 65535x65535.')
  }

  const alphaMaskThreshold: number = options.alphaMaskThreshold ?? DEFAULT_ALPHA_MASK_THRESHOLD

  if (alphaMaskThreshold < 0 || alphaMaskThreshold > 255) {
    throw new GB7CodecError('GB7_INVALID_FLAGS', 'Alpha mask threshold must be in the 0..255 range.')
  }

  const includeMask: boolean = options.includeMask ?? hasTransparentPixels(imageData, alphaMaskThreshold)
  const pixelCount: number = width * height
  const outputBuffer: ArrayBuffer = new ArrayBuffer(GB7_HEADER_SIZE + pixelCount)
  const output: Uint8Array<ArrayBuffer> = new Uint8Array(outputBuffer)

  // Формируем бинарный header строго по спецификации GrayBit-7.
  output.set(GB7_SIGNATURE, 0)
  output[4] = GB7_VERSION
  output[5] = includeMask ? GB7_MASK_FLAG : 0x00
  writeUint16BigEndian(output, 6, width)
  writeUint16BigEndian(output, 8, height)
  output[10] = 0x00
  output[11] = 0x00

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const rgbaOffset: number = pixelIndex * 4
    const red: number = imageData.data[rgbaOffset]
    const green: number = imageData.data[rgbaOffset + 1]
    const blue: number = imageData.data[rgbaOffset + 2]
    const alpha: number = imageData.data[rgbaOffset + 3]
    const grayscale8: number = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
    const grayscale7: number = Math.round((grayscale8 / 255) * MAX_GRAYSCALE_7)
    // Старший бит используется только как маска; цветовая яркость всегда остается в младших 7 битах.
    const maskBit: number = includeMask && alpha <= alphaMaskThreshold ? 0x80 : 0x00

    output[GB7_HEADER_SIZE + pixelIndex] = grayscale7 | maskBit
  }

  return outputBuffer
}

function validateSignature(bytes: Uint8Array): void {
  for (let index = 0; index < GB7_SIGNATURE.length; index += 1) {
    if (bytes[index] !== GB7_SIGNATURE[index]) {
      throw new GB7CodecError('GB7_INVALID_SIGNATURE', 'Invalid GB7 signature.')
    }
  }
}

function readUint16BigEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function writeUint16BigEndian(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >> 8) & 0xff
  bytes[offset + 1] = value & 0xff
}

function hasTransparentPixels(imageData: ImageData, alphaMaskThreshold: number): boolean {
  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] <= alphaMaskThreshold) {
      return true
    }
  }

  return false
}
