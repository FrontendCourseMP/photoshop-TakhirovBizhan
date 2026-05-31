export type FilterChannel = 'red' | 'green' | 'blue' | 'alpha'

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
  readonly id: KernelPresetId
  readonly name: string
  readonly kernel: Kernel3x3
  readonly divisor?: number
  readonly offset?: number
}

export interface FilterSettings {
  readonly kernel: Kernel3x3
  readonly selectedChannels: readonly FilterChannel[]
  readonly edgeHandling: EdgeHandlingStrategy
  readonly previewEnabled: boolean
  readonly divisor?: number
  readonly offset?: number
}

export interface AsyncFilterTask {
  readonly cancel: () => void
}
