import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, JSX, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { OperationLoader } from '../../../shared/ui/OperationLoader/OperationLoader'
import { drawImageDataToCanvas } from '../lib/canvasUtils'
import type { ImageSize } from '../../../shared/types/imageSize'

interface PanState {
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
  readonly scrollLeft: number
  readonly scrollTop: number
}

interface ImageCanvasProps {
  readonly imageData: ImageData | null
  readonly displayScalePercent: number
  readonly isColorPickerActive?: boolean
  readonly isProcessing?: boolean
  readonly processingLabel?: string
  readonly placeholder?: ReactNode
  readonly onCanvasClick?: (event: MouseEvent, canvas: HTMLCanvasElement) => void
  readonly onViewportSizeChange?: (size: ImageSize) => void
  readonly onZoomStep?: (direction: 1 | -1) => void
}

export function ImageCanvas({
  imageData,
  displayScalePercent,
  isColorPickerActive = false,
  isProcessing = false,
  processingLabel = 'Processing image…',
  placeholder,
  onCanvasClick,
  onViewportSizeChange,
  onZoomStep,
}: ImageCanvasProps): JSX.Element {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const panStateRef = useRef<PanState | null>(null)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [viewportSize, setViewportSize] = useState<ImageSize | null>(null)
  // Панорамирование включается только когда изображение действительно не помещается,
  // иначе курсор grab обещал бы недоступное действие.
  const isPannable: boolean =
    imageData !== null &&
    viewportSize !== null &&
    (Math.round((imageData.width * displayScalePercent) / 100) > viewportSize.width ||
      Math.round((imageData.height * displayScalePercent) / 100) > viewportSize.height)

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
    const viewport: HTMLDivElement | null = viewportRef.current

    if (viewport === null) {
      return undefined
    }

    const currentViewport: HTMLDivElement = viewport

    function emitViewportSize(): void {
      // clientWidth/clientHeight описывают доступную область без scrollbars,
      // поэтому они лучше подходят для подгонки изображения под workspace.
      const size: ImageSize = {
        width: currentViewport.clientWidth,
        height: currentViewport.clientHeight,
      }

      setViewportSize(size)
      onViewportSizeChange?.(size)
    }

    emitViewportSize()

    const resizeObserver: ResizeObserver = new ResizeObserver(emitViewportSize)
    resizeObserver.observe(currentViewport)

    return (): void => {
      resizeObserver.disconnect()
    }
  }, [onViewportSizeChange])

  useEffect((): (() => void) | void => {
    // React навешивает wheel как passive listener, поэтому для Ctrl+wheel зума
    // нужен собственный обработчик с preventDefault — иначе браузер отмасштабирует страницу.
    const viewport: HTMLDivElement | null = viewportRef.current

    if (viewport === null || onZoomStep === undefined) {
      return undefined
    }

    const stepZoom: (direction: 1 | -1) => void = onZoomStep

    function handleWheel(event: WheelEvent): void {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }

      event.preventDefault()
      stepZoom(event.deltaY < 0 ? 1 : -1)
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return (): void => {
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [onZoomStep])

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const viewport: HTMLDivElement | null = viewportRef.current

    if (viewport === null || !isPannable) {
      return
    }

    // Левой кнопкой тянем только когда пипетка выключена, иначе она перехватила бы клик.
    // Средняя кнопка панорамирует всегда, как в графических редакторах.
    if (event.button !== 1 && (event.button !== 0 || isColorPickerActive)) {
      return
    }

    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    }
    viewport.setPointerCapture(event.pointerId)
    setIsPanning(true)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const panState: PanState | null = panStateRef.current
    const viewport: HTMLDivElement | null = viewportRef.current

    if (panState === null || viewport === null || panState.pointerId !== event.pointerId) {
      return
    }

    viewport.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX)
    viewport.scrollTop = panState.scrollTop - (event.clientY - panState.startY)
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>): void {
    if (panStateRef.current?.pointerId !== event.pointerId) {
      return
    }

    viewportRef.current?.releasePointerCapture(event.pointerId)
    panStateRef.current = null
    setIsPanning(false)
  }

  function handleCanvasClick(event: ReactMouseEvent<HTMLCanvasElement>): void {
    // В feature color-picker передается native MouseEvent, потому что расчет координат
    // использует DOMRect и не должен зависеть от React SyntheticEvent.
    if (onCanvasClick === undefined) {
      return
    }

    onCanvasClick(event.nativeEvent, event.currentTarget)
  }

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

  return (
    <div className="canvas-frame">
      <OperationLoader active={isProcessing} label={processingLabel} variant="overlay" />
      <div
        className={buildClassName([
          'canvas-viewport',
          isPanning ? 'canvas-viewport--panning' : '',
          isPannable && !isColorPickerActive ? 'canvas-viewport--grabbable' : '',
        ])}
        ref={viewportRef}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        {imageData === null ? (
          placeholder
        ) : (
          <div className="canvas-stage">
            <canvas
              className={buildClassName([
                'image-canvas',
                isColorPickerActive ? 'image-canvas--picker-active' : '',
                displayScalePercent > 100 ? 'image-canvas--pixelated' : '',
              ])}
              onClick={handleCanvasClick}
              ref={canvasRef}
              style={canvasStyle}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function buildClassName(parts: readonly string[]): string {
  return parts.filter(Boolean).join(' ')
}
