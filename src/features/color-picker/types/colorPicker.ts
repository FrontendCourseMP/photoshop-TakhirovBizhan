import type { CIELABColor, RGBAColor } from '../../../shared/types/color'

export interface ImageCoordinates {
  readonly x: number
  readonly y: number
}

export type ColorPickerMode = 'source' | 'displayed'

export interface PixelInfo {
  readonly coordinates: ImageCoordinates
  readonly rgba: RGBAColor
  readonly lab: CIELABColor
}

export interface ColorPickerResult {
  readonly mode: ColorPickerMode
  readonly pixel: PixelInfo
}
