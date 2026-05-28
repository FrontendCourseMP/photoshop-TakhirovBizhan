import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { drawImageDataToCanvas } from '../../image-viewer/lib/canvasUtils'

interface ChannelPreviewProps {
  readonly title: string
  readonly imageData: ImageData
  readonly isInactive?: boolean
}

export function ChannelPreview({ title, imageData, isInactive = false }: ChannelPreviewProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect((): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null) {
      return
    }

    drawImageDataToCanvas(canvas, imageData)
  }, [imageData])

  return (
    <div className={isInactive ? 'channel-preview channel-preview--inactive' : 'channel-preview'}>
      <canvas className="channel-preview__canvas" ref={canvasRef} />
      <span className="channel-preview__title">{title}</span>
    </div>
  )
}
