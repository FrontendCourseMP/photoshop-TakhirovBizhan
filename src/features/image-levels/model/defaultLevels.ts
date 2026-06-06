import type { LevelsChannel, LevelsRange, LevelsSettings, LevelsState } from '../types'

export const LEVELS_CHANNELS: readonly LevelsChannel[] = ['master', 'red', 'green', 'blue', 'alpha']

export const DEFAULT_LEVELS_SETTINGS: LevelsSettings = {
  // Значения по умолчанию дают линейное отображение 0..255 без изменения изображения.
  blackPoint: 0,
  whitePoint: 255,
  gamma: 1,
}

export const DEFAULT_LEVELS_STATE: LevelsState = {
  // Каждый канал получает отдельную настройку в state, чтобы пользователь мог
  // переключаться между Master/R/G/B/A без потери введенных значений.
  master: DEFAULT_LEVELS_SETTINGS,
  red: DEFAULT_LEVELS_SETTINGS,
  green: DEFAULT_LEVELS_SETTINGS,
  blue: DEFAULT_LEVELS_SETTINGS,
  alpha: DEFAULT_LEVELS_SETTINGS,
}

export const BLACK_POINT_RANGE: LevelsRange = {
  // Black point ограничен 254, потому что white point должен оставаться хотя бы на 1 выше.
  min: 0,
  max: 254,
  step: 1,
}

export const WHITE_POINT_RANGE: LevelsRange = {
  // White point начинается с 1, чтобы диапазон input levels не схлопывался в ноль.
  min: 1,
  max: 255,
  step: 1,
}

export const GAMMA_RANGE: LevelsRange = {
  // Диапазон 0.1..9.9 соответствует типичному поведению Levels:
  // малые значения осветляют midtones, большие затемняют.
  min: 0.1,
  max: 9.9,
  step: 0.1,
}
