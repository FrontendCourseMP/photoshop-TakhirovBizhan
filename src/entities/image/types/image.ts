// Доменная модель изображения: эти типы описывают общий контракт между upload,
// viewer, download, status bar и инструментами обработки.
export type ImageFileFormat = 'png' | 'jpeg' | 'gb7'

// colorMode описывает представление данных для UI и metadata, а не меняет то,
// что ImageData внутри canvas всегда хранится как RGBA.
export type ImageColorMode = 'rgba' | 'rgb' | 'grayscale'

export interface ImageMetadata {
  // Размеры относятся к исходному ImageData, а не к CSS scale на экране.
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
  // imageData считается текущим редактируемым состоянием изображения.
  // Preview tools должны создавать копии и записывать сюда только после Apply.
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

// Коды ошибок типизированы, чтобы UI мог показывать понятные сообщения
// без парсинга текста исключения.
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
  // includeMask позволяет явно включить/выключить старший бит маски при экспорте GB7.
  readonly includeMask?: boolean
  readonly alphaMaskThreshold?: number
}
