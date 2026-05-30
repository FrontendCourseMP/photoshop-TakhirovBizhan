export type LevelsChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha'

export interface LevelsSettings {
  readonly blackPoint: number
  readonly whitePoint: number
  readonly gamma: number
}

export type LevelsState = Readonly<Record<LevelsChannel, LevelsSettings>>

export interface LevelsRange {
  readonly min: number
  readonly max: number
  readonly step: number
}
