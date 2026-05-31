import type { ImageSize } from '../../../shared/types/imageSize'

export type InterpolationMethod = 'nearest-neighbor' | 'bilinear'

export type ResizeInputMode = 'pixels' | 'percent'

export interface InterpolationAlgorithm {
  readonly id: InterpolationMethod
  readonly label: string
  readonly description: string
  readonly resize: (source: ImageData, targetSize: ImageSize) => ImageData
}

export interface ResizeSettings {
  readonly inputMode: ResizeInputMode
  readonly width: number
  readonly height: number
  readonly keepAspectRatio: boolean
  readonly interpolationMethod: InterpolationMethod
}

export interface ResizeValidationResult {
  readonly ok: boolean
  readonly message: string | null
}

export interface ResizeStats {
  readonly beforePixels: number
  readonly afterPixels: number
  readonly beforeMegapixels: number
  readonly afterMegapixels: number
}
