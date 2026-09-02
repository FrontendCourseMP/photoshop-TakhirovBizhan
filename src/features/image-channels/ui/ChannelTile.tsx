import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { drawImageDataToCanvas } from '../../image-viewer/lib/canvasUtils'
import type { ChannelPreviewKind } from '../types'

interface ChannelTileProps {
  readonly kind: ChannelPreviewKind
  readonly label: string
  readonly imageData: ImageData
  readonly isVisible: boolean
  readonly onToggle: () => void
}

export function ChannelTile({ kind, label, imageData, isVisible, onToggle }: ChannelTileProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect((): void => {
    // Миниатюра рисуется через canvas, потому что ее источник - тоже ImageData:
    // React не должен сериализовать пиксели в JSX или data URL при каждом render.
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null) {
      return
    }

    drawImageDataToCanvas(canvas, imageData)
  }, [imageData])

  // Плитка сама является переключателем, поэтому состояние канала объявляется через aria-pressed,
  // а не отдельным checkbox рядом с превью.
  return (
    <button
      className={isVisible ? 'channel-tile' : 'channel-tile channel-tile--hidden'}
      type="button"
      aria-pressed={isVisible}
      title={isVisible ? `Hide the ${label} channel` : `Show the ${label} channel`}
      onClick={onToggle}
    >
      <span className="channel-tile__frame">
        <canvas className="channel-tile__canvas" ref={canvasRef} />
        {isVisible ? null : <span className="channel-tile__flag">Hidden</span>}
      </span>
      <span className="channel-tile__footer">
        <span className={`channel-dot channel-dot--${kind}`} aria-hidden="true" />
        <span className="channel-tile__label">{label}</span>
        {isVisible ? <Icon name="check" size={13} /> : null}
      </span>
    </button>
  )
}
