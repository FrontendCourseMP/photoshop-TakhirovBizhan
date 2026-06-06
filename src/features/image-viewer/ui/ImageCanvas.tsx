import { useEffect, useRef } from 'react'
import type { CSSProperties, JSX, MouseEvent as ReactMouseEvent } from 'react'
import { drawImageDataToCanvas } from '../lib/canvasUtils'
import type { ImageSize } from '../../../shared/types/imageSize'

interface ImageCanvasProps {
  readonly imageData: ImageData | null
  readonly displayScalePercent: number
  readonly isColorPickerActive?: boolean
  readonly onCanvasClick?: (event: MouseEvent, canvas: HTMLCanvasElement) => void
  readonly onViewportSizeChange?: (size: ImageSize) => void
}

export function ImageCanvas({
  imageData,
  displayScalePercent,
  isColorPickerActive = false,
  onCanvasClick,
  onViewportSizeChange,
}: ImageCanvasProps): JSX.Element {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect((): void => {
    // Отрисовка отделена от JSX: React управляет элементом canvas,
    // а реальные пиксели записываются через Canvas API только при смене ImageData.
    const canvas: HTMLCanvasElement | null = canvasRef.current

    if (canvas === null || imageData === null) {
      return
    }

    drawImageDataToCanvas(canvas, imageData)
  }, [imageData])

  useEffect((): (() => void) | void => {
    // Размер viewport нужен page-слою для расчета стартового display scale.
    // ResizeObserver реагирует и на изменение окна, и на перестроение layout.
    const shell: HTMLDivElement | null = shellRef.current

    if (shell === null || onViewportSizeChange === undefined) {
      return undefined
    }

    const currentShell: HTMLDivElement = shell
    const emitSize: (size: ImageSize) => void = onViewportSizeChange

    function emitViewportSize(): void {
      // clientWidth/clientHeight описывают доступную область без scrollbars,
      // поэтому они лучше подходят для подгонки изображения под workspace.
      emitSize({
        width: currentShell.clientWidth,
        height: currentShell.clientHeight,
      })
    }

    emitViewportSize()

    const resizeObserver: ResizeObserver = new ResizeObserver(emitViewportSize)
    resizeObserver.observe(currentShell)

    return (): void => {
      resizeObserver.disconnect()
    }
  }, [onViewportSizeChange])

  const canvasStyle: CSSProperties | undefined =
    imageData === null
      ? undefined
      : {
          // Реальный размер canvas остается равным размеру ImageData, а CSS-размер
          // отвечает только за отображаемый scale. Так пипетка может восстановить
          // координаты исходного пикселя через соотношение backing size и CSS size.
          width: `${Math.max(Math.round((imageData.width * displayScalePercent) / 100), 1)}px`,
          height: `${Math.max(Math.round((imageData.height * displayScalePercent) / 100), 1)}px`,
        }

  function handleCanvasClick(event: ReactMouseEvent<HTMLCanvasElement>): void {
    // В feature color-picker передается native MouseEvent, потому что расчет координат
    // использует DOMRect и не должен зависеть от React SyntheticEvent.
    if (onCanvasClick === undefined) {
      return
    }

    onCanvasClick(event.nativeEvent, event.currentTarget)
  }

  return (
    <div className="canvas-shell" ref={shellRef}>
      {imageData === null ? (
        <div className="canvas-placeholder">Open PNG, JPG/JPEG or GB7 image</div>
      ) : null}
      <canvas
        className={[
          imageData === null ? 'image-canvas image-canvas--empty' : 'image-canvas',
          isColorPickerActive ? 'image-canvas--picker-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleCanvasClick}
        ref={canvasRef}
        style={canvasStyle}
      />
    </div>
  )
}
