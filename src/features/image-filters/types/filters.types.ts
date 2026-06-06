// FilterChannel задает компоненты ImageData, к которым применяется kernel.
export type FilterChannel = 'red' | 'green' | 'blue' | 'alpha'

// Strategy определяет, какие пиксели использовать, когда окно 3x3 выходит за границу изображения.
export type EdgeHandlingStrategy = 'black' | 'white' | 'copy'

export type KernelPresetId = 'identity' | 'sharpen' | 'gaussian-3x3' | 'box-blur' | 'prewitt-x' | 'prewitt-y'

export type Kernel3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface KernelPreset {
  // Preset объединяет матрицу свертки и параметры нормализации,
  // чтобы UI мог применить готовый фильтр одной операцией.
  readonly id: KernelPresetId
  readonly name: string
  readonly kernel: Kernel3x3
  readonly divisor?: number
  readonly offset?: number
}

export interface FilterSettings {
  // Settings являются полной конфигурацией preview/apply для фильтра 3x3.
  readonly kernel: Kernel3x3
  readonly selectedChannels: readonly FilterChannel[]
  readonly edgeHandling: EdgeHandlingStrategy
  readonly previewEnabled: boolean
  readonly divisor?: number
  readonly offset?: number
}

export interface AsyncFilterTask {
  // cancel нужен для отмены устаревших preview-задач при быстром изменении settings.
  readonly cancel: () => void
}
