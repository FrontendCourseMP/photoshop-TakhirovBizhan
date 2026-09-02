import type { HistogramData, HistogramMode } from '../types'

interface HistogramColor {
  readonly stroke: string
  readonly fill: string
}

const HISTOGRAM_COLOR: HistogramColor = {
  stroke: 'rgba(22, 35, 42, 0.12)',
  fill: 'rgba(15, 118, 110, 0.78)',
}

// Направляющие на четвертях диапазона дают ориентиры по оси яркости внутри самого графика.
const HISTOGRAM_GUIDE_STOPS: readonly number[] = [0.25, 0.5, 0.75]

const HISTOGRAM_DISPLAY_PERCENTILE = 0.96

/**
 * Рисует столбцы гистограммы напрямую на canvas, чтобы не добавлять chart-зависимости и удешевить перерисовку.
 */
export function drawHistogram(
  canvas: HTMLCanvasElement,
  histogram: HistogramData,
  mode: HistogramMode,
): void {
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

  if (context === null) {
    return
  }

  const width: number = canvas.width
  const height: number = canvas.height
  // Log mode сжимает высокие пики, чтобы редкие значения не терялись рядом с доминирующими тонами.
  const values: readonly number[] = Array.from(histogram, (value: number): number =>
    mode === 'log' ? Math.log1p(value) : value,
  )
  const maxValue: number = getDisplayMaxValue(values)
  const barWidth: number = width / histogram.length

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  context.strokeStyle = HISTOGRAM_COLOR.stroke
  context.lineWidth = 1

  for (const stop of HISTOGRAM_GUIDE_STOPS) {
    const guideX: number = Math.round(width * stop) + 0.5

    context.beginPath()
    context.moveTo(guideX, 0)
    context.lineTo(guideX, height)
    context.stroke()
  }

  context.fillStyle = HISTOGRAM_COLOR.fill

  for (let binIndex = 0; binIndex < histogram.length; binIndex += 1) {
    // Даже одиночные значения рисуются высотой минимум 1px, иначе тонкие детали гистограммы пропадают.
    const normalizedHeight: number = Math.min(values[binIndex] / maxValue, 1)
    const barHeight: number = Math.max(normalizedHeight * height, values[binIndex] > 0 ? 1 : 0)
    const x: number = binIndex * barWidth
    const y: number = height - barHeight

    context.fillRect(x, y, Math.ceil(barWidth), barHeight)
  }
}

function getDisplayMaxValue(values: readonly number[]): number {
  const nonZeroValues: number[] = values
    .filter((value: number): boolean => value > 0)
    .sort((left: number, right: number): number => left - right)

  if (nonZeroValues.length === 0) {
    return 1
  }

  // Один доминирующий тон - ровный фон или залитая область - дает пик в разы выше остальных bins.
  // Нормализация по такому пику превращает остальное распределение в почти пустую линию,
  // поэтому масштаб берется по перцентилю: пик обрезается, а тональный диапазон остается читаемым.
  const percentileIndex: number = Math.max(Math.floor((nonZeroValues.length - 1) * HISTOGRAM_DISPLAY_PERCENTILE), 0)

  return Math.max(nonZeroValues[percentileIndex], 1)
}
