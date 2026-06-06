import type { ImageSize } from '../../../shared/types/imageSize'
import type { InterpolationMethod } from '../types'

export function resizeImage(source: ImageData, targetSize: ImageSize, method: InterpolationMethod): ImageData {
  // Dispatcher отделяет UI от конкретного алгоритма и упрощает добавление Bicubic/Lanczos в будущем.
  return method === 'nearest-neighbor'
    ? resizeNearestNeighbor(source, targetSize)
    : resizeBilinear(source, targetSize)
}

/**
 * Nearest Neighbor выбирает ближайший исходный пиксель без смешивания цветов.
 * Метод быстрый и хорошо сохраняет жесткие границы, но при увеличении дает ступенчатость.
 */
/**
 * Nearest Neighbor берет ближайший исходный пиксель без смешивания цветов.
 * Такой подход быстрый и полезен для pixel-art, но при увеличении дает ступенчатые границы.
 */
export function resizeNearestNeighbor(source: ImageData, targetSize: ImageSize): ImageData {
  const targetWidth: number = normalizeDimension(targetSize.width)
  const targetHeight: number = normalizeDimension(targetSize.height)
  const output: ImageData = createEmptyImageData(targetWidth, targetHeight)
  const scaleX: number = source.width / targetWidth
  const scaleY: number = source.height / targetHeight

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY: number = Math.min(Math.floor((y + 0.5) * scaleY), source.height - 1)

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX: number = Math.min(Math.floor((x + 0.5) * scaleX), source.width - 1)
      copyPixel(source.data, output.data, source.width, targetWidth, sourceX, sourceY, x, y)
    }
  }

  return output
}

/**
 * Bilinear интерполирует цвет по четырем соседним пикселям исходного изображения.
 * Координаты берутся по центрам пикселей, чтобы масштабирование не давало систематического сдвига.
 */
/**
 * Bilinear смешивает четыре ближайших пикселя, чтобы получить более плавный результат.
 * Координаты считаются от центров пикселей, иначе при масштабировании появлялся бы визуальный сдвиг.
 */
export function resizeBilinear(source: ImageData, targetSize: ImageSize): ImageData {
  const targetWidth: number = normalizeDimension(targetSize.width)
  const targetHeight: number = normalizeDimension(targetSize.height)
  const output: ImageData = createEmptyImageData(targetWidth, targetHeight)
  const scaleX: number = source.width / targetWidth
  const scaleY: number = source.height / targetHeight

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY: number = Math.max((y + 0.5) * scaleY - 0.5, 0)
    const y0: number = Math.floor(sourceY)
    const y1: number = Math.min(y0 + 1, source.height - 1)
    const yWeight: number = sourceY - y0

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX: number = Math.max((x + 0.5) * scaleX - 0.5, 0)
      const x0: number = Math.floor(sourceX)
      const x1: number = Math.min(x0 + 1, source.width - 1)
      const xWeight: number = sourceX - x0

      writeBilinearPixel(source, output, x, y, x0, y0, x1, y1, xWeight, yWeight)
    }
  }

  return output
}

function writeBilinearPixel(
  source: ImageData,
  output: ImageData,
  targetX: number,
  targetY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  xWeight: number,
  yWeight: number,
): void {
  const targetIndex: number = (targetY * output.width + targetX) * 4
  const topLeftIndex: number = (y0 * source.width + x0) * 4
  const topRightIndex: number = (y0 * source.width + x1) * 4
  const bottomLeftIndex: number = (y1 * source.width + x0) * 4
  const bottomRightIndex: number = (y1 * source.width + x1) * 4

  // Каждый RGBA-канал интерполируется отдельно, включая Alpha, чтобы прозрачные края не превращались в резкие ступени.
  for (let channel = 0; channel < 4; channel += 1) {
    const top: number = interpolate(source.data[topLeftIndex + channel], source.data[topRightIndex + channel], xWeight)
    const bottom: number = interpolate(
      source.data[bottomLeftIndex + channel],
      source.data[bottomRightIndex + channel],
      xWeight,
    )

    output.data[targetIndex + channel] = Math.round(interpolate(top, bottom, yWeight))
  }
}

function copyPixel(
  source: Uint8ClampedArray,
  target: Uint8ClampedArray,
  sourceWidth: number,
  targetWidth: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): void {
  const sourceIndex: number = (sourceY * sourceWidth + sourceX) * 4
  const targetIndex: number = (targetY * targetWidth + targetX) * 4

  target[targetIndex] = source[sourceIndex]
  target[targetIndex + 1] = source[sourceIndex + 1]
  target[targetIndex + 2] = source[sourceIndex + 2]
  target[targetIndex + 3] = source[sourceIndex + 3]
}

function interpolate(start: number, end: number, weight: number): number {
  return start + (end - start) * weight
}

function normalizeDimension(value: number): number {
  return Math.max(Math.round(value), 1)
}

function createEmptyImageData(width: number, height: number): ImageData {
  const buffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
  const data: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(buffer)

  return new ImageData(data, width, height)
}
