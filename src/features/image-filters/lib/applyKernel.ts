import { clamp } from '../../../shared/lib/math/clamp'
import type { FilterChannel, FilterSettings } from '../types'
import { readSample, resolveSampleOffset } from './edgeHandling'

const CHANNEL_TO_OFFSET: Readonly<Record<FilterChannel, number>> = {
  red: 0,
  green: 1,
  blue: 2,
  alpha: 3,
}

const TAPS_PER_KERNEL = 9

/**
 * Применяет свертку 3x3 к выбранным каналам и возвращает новый ImageData.
 * source.data не мутируется, а невыбранные каналы копируются напрямую,
 * чтобы фильтр не ломал существующий alpha/RGB pipeline.
 */
export function applyKernel3x3(source: ImageData, settings: FilterSettings): ImageData {
  const outputBuffer: ArrayBuffer = new ArrayBuffer(source.data.length)
  const outputData: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(outputBuffer)
  const selectedOffsets: ReadonlySet<number> = new Set(
    settings.selectedChannels.map((channel: FilterChannel): number => CHANNEL_TO_OFFSET[channel]),
  )
  const divisor: number = normalizeDivisor(settings.divisor)
  const offset: number = settings.offset ?? 0
  // Один переиспользуемый scratch-буфер на весь проход: соседей резолвим один раз на пиксель,
  // а не по разу на каждый канал, и не аллоцируем новый массив на каждый пиксель.
  const tapOffsets: Int32Array = new Int32Array(TAPS_PER_KERNEL)

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const targetIndex: number = (y * source.width + x) * 4

      resolveTapOffsets(tapOffsets, source.width, source.height, x, y, settings.edgeHandling)

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        if (!selectedOffsets.has(channelOffset)) {
          outputData[targetIndex + channelOffset] = source.data[targetIndex + channelOffset]
          continue
        }

        outputData[targetIndex + channelOffset] = calculateConvolvedChannel(
          source.data,
          settings,
          tapOffsets,
          channelOffset,
          divisor,
          offset,
        )
      }
    }
  }

  return new ImageData(outputData, source.width, source.height)
}

function resolveTapOffsets(
  tapOffsets: Int32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  edgeHandling: FilterSettings['edgeHandling'],
): void {
  let tap = 0

  for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
    for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
      tapOffsets[tap] = resolveSampleOffset(width, height, x + kernelX, y + kernelY, edgeHandling)
      tap += 1
    }
  }
}

function calculateConvolvedChannel(
  data: Uint8ClampedArray,
  settings: FilterSettings,
  tapOffsets: Int32Array,
  channelOffset: number,
  divisor: number,
  offset: number,
): number {
  let sum = 0

  for (let tap = 0; tap < TAPS_PER_KERNEL; tap += 1) {
    sum += settings.kernel[tap] * readSample(data, tapOffsets[tap], channelOffset)
  }

  return Math.round(clamp(sum / divisor + offset, 0, 255))
}

function normalizeDivisor(divisor: number | undefined): number {
  // divisor = 0 или нечисловое значение разрушило бы формулу свертки, поэтому безопасно заменяем его на 1.
  if (divisor === undefined || !Number.isFinite(divisor) || divisor === 0) {
    return 1
  }

  return divisor
}
