import type { RGBColor } from '../../types/color'

export function rgbToHex(rgb: RGBColor): string {
  // HEX нужен UI пипетки как компактное текстовое представление выбранного цвета.
  return `#${toHexChannel(rgb.r)}${toHexChannel(rgb.g)}${toHexChannel(rgb.b)}`
}

function toHexChannel(value: number): string {
  // Канал округляется и дополняется нулем слева, чтобы всегда получить две hex-цифры.
  return Math.round(value).toString(16).padStart(2, '0')
}
