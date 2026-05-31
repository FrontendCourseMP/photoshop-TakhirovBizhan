import { clamp } from '../../../shared/lib/math/clamp'
import type { ImageSize } from '../../../shared/types/imageSize'
import { MAX_DISPLAY_SCALE_PERCENT, MIN_DISPLAY_SCALE_PERCENT } from '../model/displayScaleConstants'

export function clampScalePercent(value: number): number {
  return Math.round(clamp(value, MIN_DISPLAY_SCALE_PERCENT, MAX_DISPLAY_SCALE_PERCENT))
}

/**
 * Вычисляет стартовый Display Scale так, чтобы изображение помещалось в рабочую область с отступом.
 * Физический размер ImageData не меняется: результат влияет только на отображение canvas.
 */
export function calculateInitialDisplayScale(imageSize: ImageSize, canvasSize: ImageSize, padding: number): number {
  const availableWidth: number = Math.max(canvasSize.width - padding * 2, 1)
  const availableHeight: number = Math.max(canvasSize.height - padding * 2, 1)
  const widthScale: number = availableWidth / Math.max(imageSize.width, 1)
  const heightScale: number = availableHeight / Math.max(imageSize.height, 1)
  const fitScalePercent: number = Math.min(widthScale, heightScale) * 100

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
  const targetWidth: number = Math.max(Math.round(imageData.width * scale), 1)
  const targetHeight: number = Math.max(Math.round(imageData.height * scale), 1)
  const x: number = Math.round((canvasSize.width - targetWidth) / 2)
  const y: number = Math.round((canvasSize.height - targetHeight) / 2)
  const sourceCanvas: HTMLCanvasElement = document.createElement('canvas')
  const sourceContext: CanvasRenderingContext2D | null = sourceCanvas.getContext('2d')

  if (sourceContext === null) {
    return
  }

  sourceCanvas.width = imageData.width
  sourceCanvas.height = imageData.height
  sourceContext.putImageData(imageData, 0, 0)

  context.clearRect(0, 0, canvasSize.width, canvasSize.height)
  context.imageSmoothingEnabled = false
  context.drawImage(sourceCanvas, x, y, targetWidth, targetHeight)
}
