import type { RGBColor } from '../../types/color'

export function rgbToHex(rgb: RGBColor): string {
  return `#${toHexChannel(rgb.r)}${toHexChannel(rgb.g)}${toHexChannel(rgb.b)}`
}

function toHexChannel(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0')
}
