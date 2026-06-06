import { clamp } from '../../../shared/lib/math/clamp'
import type { ImageSize } from '../../../shared/types/imageSize'
import { MAX_DISPLAY_SCALE_PERCENT, MIN_DISPLAY_SCALE_PERCENT } from '../model/displayScaleConstants'

export function clampScalePercent(value: number): number {
  // Scale ограничивается единым диапазоном, чтобы controls и canvas
  // одинаково реагировали на ручной ввод и программный пересчет.
  return Math.round(clamp(value, MIN_DISPLAY_SCALE_PERCENT, MAX_DISPLAY_SCALE_PERCENT))
}

/**
 * Вычисляет стартовый Display Scale так, чтобы изображение помещалось в рабочую область с отступом.
 * Физический размер ImageData не меняется: результат влияет только на отображение canvas.
 */
export function calculateInitialDisplayScale(imageSize: ImageSize, canvasSize: ImageSize, padding: number): number {
  // Отступ вычитается с обеих сторон, чтобы изображение не упиралось в границы workspace.
  const availableWidth: number = Math.max(canvasSize.width - padding * 2, 1)
  const availableHeight: number = Math.max(canvasSize.height - padding * 2, 1)
  const widthScale: number = availableWidth / Math.max(imageSize.width, 1)
  const heightScale: number = availableHeight / Math.max(imageSize.height, 1)
  const fitScalePercent: number = Math.min(widthScale, heightScale) * 100

  // Берем меньший коэффициент, потому что изображение должно поместиться и по ширине, и по высоте.
  return clampScalePercent(fitScalePercent)
}

/**
 * Центрирует ImageData внутри canvas и рисует его с заданным Display Scale.
 * Алгоритм нужен именно для отображения; resize изображения выполняется отдельной feature.
 */
export function drawImageCenteredWithScale(
  context: CanvasRenderingContext2D,
  imageData: ImageData,
  canvasSize: ImageSize,
  scalePercent: number,
): void {
  const scale: number = clampScalePercent(scalePercent) / 100
  // Минимум 1px защищает drawImage от нулевых размеров при очень маленьком scale.
  const targetWidth: number = Math.max(Math.round(imageData.width * scale), 1)
  const targetHeight: number = Math.max(Math.round(imageData.height * scale), 1)
  const x: number = Math.round((canvasSize.width - targetWidth) / 2)
  const y: number = Math.round((canvasSize.height - targetHeight) / 2)
  const sourceCanvas: HTMLCanvasElement = document.createElement('canvas')
  const sourceContext: CanvasRenderingContext2D | null = sourceCanvas.getContext('2d')

  if (sourceContext === null) {
    return
  }

  // Временный source canvas нужен, потому что drawImage умеет масштабировать canvas/image,
  // но не принимает ImageData напрямую.
  sourceCanvas.width = imageData.width
  sourceCanvas.height = imageData.height
  sourceContext.putImageData(imageData, 0, 0)

  context.clearRect(0, 0, canvasSize.width, canvasSize.height)
  // Для редактора пиксельных данных отключаем smoothing, чтобы scale не менял значения
  // отображаемых пикселей визуальной интерполяцией.
  context.imageSmoothingEnabled = false
  context.drawImage(sourceCanvas, x, y, targetWidth, targetHeight)
}
