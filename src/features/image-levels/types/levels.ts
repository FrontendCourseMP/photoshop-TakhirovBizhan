// Master применяется к RGB сразу, отдельные каналы позволяют корректировать
// конкретную компоненту, а alpha управляет прозрачностью независимо от цвета.
export type LevelsChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha'

// Три маркера входных уровней: черная и белая точки задают границы диапазона,
// полутоновой отвечает за гамму внутри этих границ.
export type LevelsMarker = 'black' | 'midtone' | 'white'

export interface LevelsSettings {
  // blackPoint/whitePoint задают входной диапазон, который будет растянут в 0..255.
  readonly blackPoint: number
  readonly whitePoint: number
  readonly gamma: number
}

export type LevelsState = Readonly<Record<LevelsChannel, LevelsSettings>>

export interface LevelsChannelOption {
  // Список опций строится по формату файла, поэтому подпись хранится рядом с каналом:
  // у grayscale-изображения master - это единственный тоновый канал, а не режим для трех сразу.
  readonly channel: LevelsChannel
  readonly label: string
}

export interface LevelsRange {
  // Range описывает границы параметра: те же значения применяют и поля ввода, и маркеры оси.
  readonly min: number
  readonly max: number
  readonly step: number
}
