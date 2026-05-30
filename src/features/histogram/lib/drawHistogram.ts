import type { HistogramData, HistogramMode } from '../types'

interface HistogramColor {
  readonly stroke: string
  readonly fill: string
}

const HISTOGRAM_COLOR: HistogramColor = {
  stroke: '#132126',
  fill: 'rgba(35, 122, 114, 0.72)',
}

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
  const values: readonly number[] = Array.from(histogram, (value: number): number =>
    mode === 'log' ? Math.log1p(value) : value,
  )
  const maxValue: number = Math.max(...values, 1)
  const barWidth: number = width / histogram.length

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#f7fafb'
  context.fillRect(0, 0, width, height)
  context.fillStyle = HISTOGRAM_COLOR.fill
  context.strokeStyle = HISTOGRAM_COLOR.stroke

  for (let binIndex = 0; binIndex < histogram.length; binIndex += 1) {
    const normalizedHeight: number = values[binIndex] / maxValue
    const barHeight: number = Math.max(normalizedHeight * height, values[binIndex] > 0 ? 1 : 0)
    const x: number = binIndex * barWidth
    const y: number = height - barHeight

    context.fillRect(x, y, Math.ceil(barWidth), barHeight)
  }

  context.strokeRect(0.5, 0.5, width - 1, height - 1)
}
