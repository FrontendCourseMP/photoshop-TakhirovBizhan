// RGB хранится в стандартном 8-битном диапазоне 0..255 для каждого канала.
export interface RGBColor {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface RGBAColor extends RGBColor {
  // Alpha также хранится как 0..255, как в ImageData.
  readonly a: number
}

// CIELAB используется для пипетки; значения уже округляются в color conversion.
export interface CIELABColor {
  readonly l: number
  readonly a: number
  readonly b: number
}
