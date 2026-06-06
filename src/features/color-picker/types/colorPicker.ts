import type { CIELABColor, RGBAColor } from '../../../shared/types/color'

export interface ImageCoordinates {
  // Координаты всегда относятся к пиксельной сетке ImageData, а не к окну браузера.
  readonly x: number
  readonly y: number
}

export type ColorPickerMode = 'source' | 'displayed'

export interface PixelInfo {
  // PixelInfo хранит сразу исходные RGBA и LAB, чтобы UI не повторял color conversion.
  readonly coordinates: ImageCoordinates
  readonly rgba: RGBAColor
  readonly lab: CIELABColor
}

export interface ColorPickerResult {
  // mode оставлен в результате, чтобы в будущем можно было явно различать source/displayed sampling.
  readonly mode: ColorPickerMode
  readonly pixel: PixelInfo
}
