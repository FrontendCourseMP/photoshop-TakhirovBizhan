import type { LevelsChannel, LevelsRange, LevelsSettings, LevelsState } from '../types'

export const LEVELS_CHANNELS: readonly LevelsChannel[] = ['master', 'red', 'green', 'blue', 'alpha']

export const DEFAULT_LEVELS_SETTINGS: LevelsSettings = {
  blackPoint: 0,
  whitePoint: 255,
  gamma: 1,
}

export const DEFAULT_LEVELS_STATE: LevelsState = {
  master: DEFAULT_LEVELS_SETTINGS,
  red: DEFAULT_LEVELS_SETTINGS,
  green: DEFAULT_LEVELS_SETTINGS,
  blue: DEFAULT_LEVELS_SETTINGS,
  alpha: DEFAULT_LEVELS_SETTINGS,
}

export const BLACK_POINT_RANGE: LevelsRange = {
  min: 0,
  max: 254,
  step: 1,
}

export const WHITE_POINT_RANGE: LevelsRange = {
  min: 1,
  max: 255,
  step: 1,
}

export const GAMMA_RANGE: LevelsRange = {
  min: 0.1,
  max: 9.9,
  step: 0.1,
}
