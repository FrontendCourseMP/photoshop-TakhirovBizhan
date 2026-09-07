import type { EdgeHandlingStrategy } from '../types'

// Синтетические позиции кодируются отрицательными числами, потому что реальные смещения
// в source.data всегда неотрицательны - так readSample различает их без отдельного флага.
const SYNTHETIC_BLACK = -1
const SYNTHETIC_WHITE = -2

/**
 * Резолвит соседа ядра в byte-смещение внутри source.data, а не в готовый пиксель.
 * Вызывается один раз на тап свертки (а не один раз на каждый канал), поэтому не может
 * позволить себе аллокацию: на большом изображении с 4 каналами это млн лишних массивов.
 */
export function resolveSampleOffset(
  width: number,
  height: number,
  x: number,
  y: number,
  strategy: EdgeHandlingStrategy,
): number {
  const isOutside: boolean = x < 0 || y < 0 || x >= width || y >= height

  // Стратегии black/white подставляют синтетический пиксель за границей изображения.
  // Это нужно, чтобы свертка у края имела полный набор соседей и не уменьшала размер результата.
  if (isOutside && strategy === 'black') {
    return SYNTHETIC_BLACK
  }

  if (isOutside && strategy === 'white') {
    return SYNTHETIC_WHITE
  }

  // Стратегия copy прижимает координаты к ближайшему валидному пикселю, чтобы размер результата не менялся.
  const safeX: number = Math.min(Math.max(x, 0), width - 1)
  const safeY: number = Math.min(Math.max(y, 0), height - 1)

  return (safeY * width + safeX) * 4
}

/**
 * Читает значение одного канала по смещению, которое вернул resolveSampleOffset.
 * Синтетический черный держит альфу непрозрачной (255), иначе прозрачный край
 * стал бы полностью черным пикселем, а не просто закрашенным в цвет фона.
 */
export function readSample(data: Uint8ClampedArray, sampleOffset: number, channelOffset: number): number {
  if (sampleOffset === SYNTHETIC_BLACK) {
    return channelOffset === 3 ? 255 : 0
  }

  if (sampleOffset === SYNTHETIC_WHITE) {
    return 255
  }

  return data[sampleOffset + channelOffset]
}
