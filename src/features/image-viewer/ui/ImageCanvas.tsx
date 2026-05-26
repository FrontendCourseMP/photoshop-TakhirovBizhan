import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { drawImageDataToCanvas } from '../lib/canvasUtils'

interface ImageCanvasProps {
  readonly imageData: ImageData | null
}

export function ImageCanvas({ imageData }: ImageCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect((): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null || imageData === null) {
      return
    }

    drawImageDataToCanvas(canvas, imageData)
  }, [imageData])

  return (
    <div className="canvas-shell">
      {imageData === null ? (
        <div className="canvas-placeholder">Open PNG, JPG/JPEG or GB7 image</div>
      ) : null}
      <canvas
        className={imageData === null ? 'image-canvas image-canvas--empty' : 'image-canvas'}
        ref={canvasRef}
      />
    </div>
  )
}
