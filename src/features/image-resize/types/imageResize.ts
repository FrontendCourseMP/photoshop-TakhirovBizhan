import type { ImageSize } from '../../../shared/types/imageSize'

// Метод интерполяции определяет, как брать цвет пикселя при изменении размеров.
export type InterpolationMethod = 'nearest-neighbor' | 'bilinear'

// UI поддерживает ввод абсолютных пикселей или процентов от исходного размера.
export type ResizeInputMode = 'pixels' | 'percent'

export interface InterpolationAlgorithm {
  // Объект объединяет metadata для UI и саму функцию resize, чтобы dialog не знал деталей реализации.
  readonly id: InterpolationMethod
  readonly label: string
  readonly description: string
  readonly resize: (source: ImageData, targetSize: ImageSize) => ImageData
}

export interface ResizeSettings {
  // Settings отражают только пользовательский ввод; итоговый targetSize считается отдельно.
  readonly inputMode: ResizeInputMode
  readonly width: number
  readonly height: number
  readonly keepAspectRatio: boolean
  readonly interpolationMethod: InterpolationMethod
}

export interface ResizeValidationResult {
  // message содержит причину ошибки, если ok === false.
  readonly ok: boolean
  readonly message: string | null
}

export interface ResizeStats {
  // Stats используются только для предпросмотра последствий операции до Apply.
  readonly beforePixels: number
  readonly afterPixels: number
  readonly beforeMegapixels: number
  readonly afterMegapixels: number
}
