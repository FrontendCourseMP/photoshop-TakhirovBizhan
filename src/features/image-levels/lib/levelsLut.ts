import { clamp } from '../../../shared/lib/math/clamp'
import type { LevelsSettings } from '../types'

const LUT_SIZE = 256
const MIN_GAMMA = 0.1
const MAX_GAMMA = 9.9

/**
 * Создает LUT на 256 значений для Levels.
 * LUT выносит дорогую gamma-коррекцию и ограничение диапазона из попиксельного прохода.
 */
export function createLevelsLUT(settings: LevelsSettings): Uint8Array {
  const lut: Uint8Array = new Uint8Array(LUT_SIZE)
  // Точки черного и белого нормализуются здесь, чтобы дальнейшее применение LUT было максимально дешевым.
  const blackPoint: number = clamp(Math.round(settings.blackPoint), 0, 254)
  const whitePoint: number = clamp(Math.round(settings.whitePoint), blackPoint + 1, 255)
  const gamma: number = clamp(settings.gamma, MIN_GAMMA, MAX_GAMMA)
  const range: number = Math.max(whitePoint - blackPoint, 1)

  for (let value = 0; value < LUT_SIZE; value += 1) {
    // Значение сначала переводится в диапазон 0..1 между blackPoint и whitePoint.
    // Все, что левее blackPoint, становится 0; все, что правее whitePoint, становится 1.
    const normalized: number = clamp((value - blackPoint) / range, 0, 1)
    // Значение gamma меньше 1 осветляет средние тона, больше 1 затемняет.
    const corrected: number = Number.isFinite(gamma) ? normalized ** gamma : normalized

    lut[value] = clamp(Math.round(corrected * 255), 0, 255)
  }

  return lut
}
