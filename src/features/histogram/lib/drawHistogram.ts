import type { HistogramData, HistogramMode } from '../types'

interface HistogramColor {
  readonly stroke: string
  readonly fill: string
}

const HISTOGRAM_COLOR: HistogramColor = {
  stroke: '#132126',
  fill: 'rgba(35, 122, 114, 0.72)',
}

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
  context.fillStyle = '#f7fafb'
  context.fillRect(0, 0, width, height)
  context.fillStyle = HISTOGRAM_COLOR.fill
  context.strokeStyle = HISTOGRAM_COLOR.stroke

  for (let binIndex = 0; binIndex < histogram.length; binIndex += 1) {
    // Даже одиночные значения рисуются высотой минимум 1px, иначе тонкие детали гистограммы пропадают.
    const normalizedHeight: number = Math.min(values[binIndex] / maxValue, 1)
    const barHeight: number = Math.max(normalizedHeight * height, values[binIndex] > 0 ? 1 : 0)
    const x: number = binIndex * barWidth
    const y: number = height - barHeight

    context.fillRect(x, y, Math.ceil(barWidth), barHeight)
  }

  context.strokeRect(0.5, 0.5, width - 1, height - 1)
}

function getDisplayMaxValue(values: readonly number[]): number {
  const nonZeroValues: number[] = values
    .filter((value: number): boolean => value > 0)
    .sort((left: number, right: number): number => left - right)

  if (nonZeroValues.length === 0) {
    return 1
  }

  // После Levels крайние bins 0/255 часто получают очень большие пики из-за clipping.
  // Если нормализовать график по такому одиночному пику, остальные уровни визуально
  // превращаются в почти пустую линию. Percentile-масштаб сохраняет пики, но не дает
  // им скрыть распределение тонов, как это делают графические редакторы.
  const percentileIndex: number = Math.max(Math.floor((nonZeroValues.length - 1) * HISTOGRAM_DISPLAY_PERCENTILE), 0)

  return Math.max(nonZeroValues[percentileIndex], 1)
}
