import { clamp } from '../../../shared/lib/math/clamp'
import type { ImageSize } from '../../../shared/types/imageSize'
import {
  DISPLAY_SCALE_OPTIONS,
  MAX_DISPLAY_SCALE_PERCENT,
  MIN_DISPLAY_SCALE_PERCENT,
} from '../model/displayScaleConstants'

export type ZoomDirection = 1 | -1

export function clampScalePercent(value: number): number {
  // Scale ограничивается единым диапазоном, чтобы controls и canvas
  // одинаково реагировали на ручной ввод и программный пересчет.
  return Math.round(clamp(value, MIN_DISPLAY_SCALE_PERCENT, MAX_DISPLAY_SCALE_PERCENT))
}

/**
 * Возвращает следующий шаг zoom по списку пресетов.
 * Шаги по кнопкам и колесу мыши совпадают с вариантами в select, чтобы значения не расходились.
 */
export function getZoomedScalePercent(currentPercent: number, direction: ZoomDirection): number {
  const candidates: readonly number[] =
    direction === 1
      ? DISPLAY_SCALE_OPTIONS.filter((option: number): boolean => option > currentPercent)
      : [...DISPLAY_SCALE_OPTIONS].reverse().filter((option: number): boolean => option < currentPercent)

  return clampScalePercent(candidates[0] ?? currentPercent)
}

/**
 * Список значений для select с добавленным текущим scale.
 * Fit и колесо мыши дают произвольные проценты, которых нет среди пресетов.
 */
export function getScaleOptions(currentPercent: number): readonly number[] {
  const options: Set<number> = new Set<number>([...DISPLAY_SCALE_OPTIONS, clampScalePercent(currentPercent)])

  return [...options].sort((left: number, right: number): number => left - right)
}

/**
 * Стартовый Display Scale при открытии файла и после resize.
 * В отличие от Fit, не увеличивает изображение: 100% — верхняя граница, иначе уменьшенная
 * картинка снова растянулась бы на всю область и результат операции был бы незаметен.
 */
export function calculateInitialDisplayScale(imageSize: ImageSize, canvasSize: ImageSize, padding: number): number {
  return Math.min(calculateFitScalePercent(imageSize, canvasSize, padding), 100)
}

/**
 * Вписывает изображение в рабочую область с отступом, включая увеличение мелких файлов.
 * Физический размер ImageData не меняется: результат влияет только на отображение canvas.
 */
export function calculateFitScalePercent(imageSize: ImageSize, canvasSize: ImageSize, padding: number): number {
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
