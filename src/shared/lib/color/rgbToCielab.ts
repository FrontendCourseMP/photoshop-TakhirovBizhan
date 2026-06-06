import type { CIELABColor, RGBColor } from '../../types/color'

interface XYZColor {
  readonly x: number
  readonly y: number
  readonly z: number
}

const D65_WHITE_POINT: XYZColor = {
  x: 95.047,
  y: 100,
  z: 108.883,
}

export function rgbToCielab(rgb: RGBColor): CIELABColor {
  // CIELAB считается через промежуточное XYZ-пространство, потому что LAB привязан к perceptual lightness.
  const xyz: XYZColor = rgbToXyz(rgb)

  const x: number = labPivot(xyz.x / D65_WHITE_POINT.x)
  const y: number = labPivot(xyz.y / D65_WHITE_POINT.y)
  const z: number = labPivot(xyz.z / D65_WHITE_POINT.z)

  return {
    l: roundToTwoDecimals(116 * y - 16),
    a: roundToTwoDecimals(500 * (x - y)),
    b: roundToTwoDecimals(200 * (y - z)),
  }
}

function rgbToXyz(rgb: RGBColor): XYZColor {
  // sRGB хранится с гамма-кривой, поэтому перед матричным преобразованием значения нужно линеаризовать.
  const red: number = srgbToLinear(rgb.r / 255)
  const green: number = srgbToLinear(rgb.g / 255)
  const blue: number = srgbToLinear(rgb.b / 255)

  return {
    x: (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) * 100,
    y: (red * 0.2126729 + green * 0.7151522 + blue * 0.072175) * 100,
    z: (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) * 100,
  }
}

function srgbToLinear(value: number): number {
  // Формула sRGB имеет линейный участок около нуля и степенной участок для остальных значений.
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function labPivot(value: number): number {
  const epsilon = 216 / 24389
  const kappa = 24389 / 27

  // Порог epsilon нужен, чтобы LAB оставался непрерывным около черного и не уходил в бесконечную производную.
  return value > epsilon ? Math.cbrt(value) : (kappa * value + 16) / 116
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}
