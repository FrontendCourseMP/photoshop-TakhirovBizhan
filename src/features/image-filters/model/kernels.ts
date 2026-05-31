import type { FilterSettings, KernelPreset } from '../types'

export const DEFAULT_FILTER_CHANNELS = ['red', 'green', 'blue'] as const

export const FILTER_KERNEL_PRESETS: readonly KernelPreset[] = [
  {
    id: 'identity',
    name: 'Identity',
    kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
    divisor: 1,
    offset: 0,
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
    divisor: 1,
    offset: 0,
  },
  {
    id: 'gaussian-3x3',
    name: 'Gaussian 3x3',
    kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1],
    divisor: 16,
    offset: 0,
  },
  {
    id: 'box-blur',
    name: 'Box Blur',
    kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    divisor: 9,
    offset: 0,
  },
  {
    id: 'prewitt-x',
    name: 'Prewitt X',
    kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
    divisor: 1,
    offset: 128,
  },
  {
    id: 'prewitt-y',
    name: 'Prewitt Y',
    kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
    divisor: 1,
    offset: 128,
  },
]

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  kernel: FILTER_KERNEL_PRESETS[0].kernel,
  selectedChannels: DEFAULT_FILTER_CHANNELS,
  edgeHandling: 'copy',
  previewEnabled: true,
  divisor: 1,
  offset: 0,
}
