// Доменная модель изображения
export type ImageFileFormat = 'png' | 'jpeg' | 'gb7'

export type ImageColorMode = 'rgba' | 'rgb' | 'grayscale'

export interface ImageMetadata {
  readonly width: number
  readonly height: number
  readonly colorDepth: number
  readonly format: ImageFileFormat
  readonly colorMode: ImageColorMode
  readonly fileName: string
  readonly fileSizeBytes: number
  readonly hasMask?: boolean
}

export interface EditableImage {
  readonly imageData: ImageData
  readonly metadata: ImageMetadata
}

export interface ImageLoadSuccess {
  readonly ok: true
  readonly image: EditableImage
}

export interface ImageLoadFailure {
  readonly ok: false
  readonly error: FileProcessingError
}

export type ImageLoadResult = ImageLoadSuccess | ImageLoadFailure

export type FileProcessingErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'IMAGE_DECODE_FAILED'
  | 'CANVAS_CONTEXT_UNAVAILABLE'
  | 'CANVAS_EXPORT_FAILED'
  | 'GB7_INVALID_SIGNATURE'
  | 'GB7_UNSUPPORTED_VERSION'
  | 'GB7_INVALID_FLAGS'
  | 'GB7_INVALID_RESERVED_BYTES'
  | 'GB7_INVALID_DIMENSIONS'
  | 'GB7_INVALID_FILE_SIZE'
  | 'UNKNOWN_ERROR'

export interface FileProcessingError {
  readonly code: FileProcessingErrorCode
  readonly message: string
  readonly cause?: unknown
}

export interface DecodedGB7Image {
  readonly imageData: ImageData
  readonly metadata: ImageMetadata
}

export interface GB7EncodeOptions {
  readonly includeMask?: boolean
  readonly alphaMaskThreshold?: number
}
