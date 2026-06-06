import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { drawHistogram } from '../lib/drawHistogram'
import type { HistogramData, HistogramMode } from '../types'

interface HistogramCanvasProps {
  readonly histogram: HistogramData
  readonly mode: HistogramMode
}

export function HistogramCanvas({ histogram, mode }: HistogramCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect((): void => {
    // Histogram рисуется императивно в canvas, потому что 256 bars быстрее
    // обновлять Canvas API, чем пересоздавать множество DOM-элементов.
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null) {
      return
    }

    drawHistogram(canvas, histogram, mode)
  }, [histogram, mode])

  return <canvas className="levels-histogram-canvas" height={150} ref={canvasRef} width={512} />
}
