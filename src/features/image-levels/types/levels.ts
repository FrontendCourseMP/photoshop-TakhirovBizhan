// Master применяется к RGB сразу, отдельные каналы позволяют корректировать
// конкретную компоненту, а alpha управляет прозрачностью независимо от цвета.
export type LevelsChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha'

export interface LevelsSettings {
  // blackPoint/whitePoint задают входной диапазон, который будет растянут в 0..255.
  readonly blackPoint: number
  readonly whitePoint: number
  readonly gamma: number
}

export type LevelsState = Readonly<Record<LevelsChannel, LevelsSettings>>

export interface LevelsRange {
  // Range описывает ограничения UI-control и совпадает с проверками в dialog.
  readonly min: number
  readonly max: number
  readonly step: number
}
