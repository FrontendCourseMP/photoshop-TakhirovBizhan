export interface RGBColor {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface RGBAColor extends RGBColor {
  readonly a: number
}

export interface CIELABColor {
  readonly l: number
  readonly a: number
  readonly b: number
}
