import { clamp } from '../../../shared/lib/math/clamp'
import type { FilterChannel, FilterSettings } from '../types'
import { getPixelWithEdgeHandling, type PixelTuple } from './edgeHandling'

const CHANNEL_TO_OFFSET: Readonly<Record<FilterChannel, number>> = {
  red: 0,
  green: 1,
  blue: 2,
  alpha: 3,
}

/**
 * Применяет свертку 3x3 к выбранным каналам, не меняя исходный ImageData.
 * Невыбранные каналы копируются напрямую, чтобы фильтр не ломал существующий alpha/RGB pipeline.
 */
export function applyKernel3x3(source: ImageData, settings: FilterSettings): ImageData {
  const outputBuffer: ArrayBuffer = new ArrayBuffer(source.data.length)
  const outputData: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(outputBuffer)
  const selectedOffsets: ReadonlySet<number> = new Set(
    settings.selectedChannels.map((channel: FilterChannel): number => CHANNEL_TO_OFFSET[channel]),
  )
  const divisor: number = normalizeDivisor(settings.divisor)
  const offset: number = settings.offset ?? 0

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const targetIndex: number = (y * source.width + x) * 4

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        if (!selectedOffsets.has(channelOffset)) {
          outputData[targetIndex + channelOffset] = source.data[targetIndex + channelOffset]
          continue
        }

        outputData[targetIndex + channelOffset] = calculateConvolvedChannel(source, settings, x, y, channelOffset, divisor, offset)
      }
    }
  }

  return new ImageData(outputData, source.width, source.height)
}

function calculateConvolvedChannel(
  source: ImageData,
  settings: FilterSettings,
  x: number,
  y: number,
  channelOffset: number,
  divisor: number,
  offset: number,
): number {
  let sum = 0
  let kernelIndex = 0

  for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
    for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
      const pixel: PixelTuple = getPixelWithEdgeHandling(
        source.data,
        source.width,
        source.height,
        x + kernelX,
        y + kernelY,
        settings.edgeHandling,
      )

      sum += settings.kernel[kernelIndex] * pixel[channelOffset]
      kernelIndex += 1
    }
  }

  return Math.round(clamp(sum / divisor + offset, 0, 255))
}

function normalizeDivisor(divisor: number | undefined): number {
  if (divisor === undefined || !Number.isFinite(divisor) || divisor === 0) {
    return 1
  }

  return divisor
}
