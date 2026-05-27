import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import { drawImageDataToCanvas } from '../lib/canvasUtils'

interface ImageCanvasProps {
  readonly imageData: ImageData | null
}

interface CanvasDisplaySize {
  readonly width: number
  readonly height: number
}

const CANVAS_SAFE_GAP_PX = 72

export function ImageCanvas({ imageData }: ImageCanvasProps): JSX.Element {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [displaySize, setDisplaySize] = useState<CanvasDisplaySize | null>(null)

  useEffect((): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null || imageData === null) {
      return
    }

    drawImageDataToCanvas(canvas, imageData)
  }, [imageData])

  useEffect((): (() => void) | void => {
    const shell: HTMLDivElement | null = shellRef.current

    if (shell === null || imageData === null) {
      setDisplaySize(null)
      return undefined
    }

    const currentShell: HTMLDivElement = shell
    const currentImageData: ImageData = imageData

    function updateDisplaySize(): void {
      const availableWidth: number = Math.max(currentShell.clientWidth - CANVAS_SAFE_GAP_PX, 1)
      const availableHeight: number = Math.max(currentShell.clientHeight - CANVAS_SAFE_GAP_PX, 1)
      // Реальный canvas остается в исходном разрешении, а CSS-размер уменьшается под viewport.
      const scale: number = Math.min(
        availableWidth / currentImageData.width,
        availableHeight / currentImageData.height,
        1,
      )

      setDisplaySize({
        width: Math.max(Math.floor(currentImageData.width * scale), 1),
        height: Math.max(Math.floor(currentImageData.height * scale), 1),
      })
    }

    updateDisplaySize()

    const resizeObserver: ResizeObserver = new ResizeObserver(updateDisplaySize)
    resizeObserver.observe(currentShell)

    return (): void => {
      resizeObserver.disconnect()
    }
  }, [imageData])

  const canvasStyle: CSSProperties | undefined =
    displaySize === null
      ? undefined
      : {
          width: `${displaySize.width}px`,
          height: `${displaySize.height}px`,
        }

  return (
    <div className="canvas-shell" ref={shellRef}>
      {imageData === null ? (
        <div className="canvas-placeholder">Open PNG, JPG/JPEG or GB7 image</div>
      ) : null}
      <canvas
        className={imageData === null ? 'image-canvas image-canvas--empty' : 'image-canvas'}
        ref={canvasRef}
        style={canvasStyle}
      />
    </div>
  )
}
