import type { FilterSettings, Kernel3x3, KernelPreset } from '../types'


export const DEFAULT_FILTER_CHANNELS = ['red', 'green', 'blue'] as const

// Presets описаны декларативно: UI может показывать список фильтров,
// а lib применяет выбранный kernel без знания названия preset.
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
  // Identity kernel выбран по умолчанию, чтобы открытие dialog не меняло изображение
  // до явного выбора фильтра или ручного изменения матрицы.
  kernel: FILTER_KERNEL_PRESETS[0].kernel,
  selectedChannels: DEFAULT_FILTER_CHANNELS,
  edgeHandling: 'copy',
  previewEnabled: true,
  divisor: 1,
  offset: 0,
}

/**
 * Находит preset, которому в точности соответствуют текущие параметры свертки.
 * Возвращает null для отредактированной вручную матрицы: такое состояние preset не описывает.
 */
export function findMatchingPreset(settings: FilterSettings): KernelPreset | null {
  const preset: KernelPreset | undefined = FILTER_KERNEL_PRESETS.find((item: KernelPreset): boolean => {
    // Сравниваются и нормализация тоже: одно и то же ядро с разным divisor дает разный результат.
    return (
      isSameKernel(item.kernel, settings.kernel) &&
      (item.divisor ?? 1) === (settings.divisor ?? 1) &&
      (item.offset ?? 0) === (settings.offset ?? 0)
    )
  })

  return preset ?? null
}

function isSameKernel(left: Kernel3x3, right: Kernel3x3): boolean {
  return left.every((value: number, index: number): boolean => value === right[index])
}
