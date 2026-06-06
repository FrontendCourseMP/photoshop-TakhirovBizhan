import type { EdgeHandlingStrategy } from '../types'

export type PixelTuple = readonly [number, number, number, number]

const BLACK_EDGE_PIXEL: PixelTuple = [0, 0, 0, 255]
const WHITE_EDGE_PIXEL: PixelTuple = [255, 255, 255, 255]

export function getPixelWithEdgeHandling(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  strategy: EdgeHandlingStrategy,
): PixelTuple {
  const isOutside: boolean = x < 0 || y < 0 || x >= width || y >= height

  // Стратегии black/white подставляют синтетический пиксель за границей изображения.
  // Это нужно, чтобы свертка у края имела полный набор соседей и не уменьшала размер результата.
  if (isOutside && strategy === 'black') {
    return BLACK_EDGE_PIXEL
  }

  if (isOutside && strategy === 'white') {
    return WHITE_EDGE_PIXEL
  }

  // Стратегия copy прижимает координаты к ближайшему валидному пикселю, чтобы размер результата не менялся.
  const safeX: number = Math.min(Math.max(x, 0), width - 1)
  const safeY: number = Math.min(Math.max(y, 0), height - 1)
  const index: number = (safeY * width + safeX) * 4

  return [data[index], data[index + 1], data[index + 2], data[index + 3]]
}
