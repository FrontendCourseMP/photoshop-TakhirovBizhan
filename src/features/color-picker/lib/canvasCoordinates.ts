import type { ImageCoordinates } from '../types'

export function getCanvasImageCoordinates(event: MouseEvent, canvas: HTMLCanvasElement): ImageCoordinates | null {
  const rect: DOMRect = canvas.getBoundingClientRect()

  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return null
  }

  const scaleX: number = canvas.width / rect.width
  const scaleY: number = canvas.height / rect.height
  const x: number = Math.floor((event.clientX - rect.left) * scaleX)
  const y: number = Math.floor((event.clientY - rect.top) * scaleY)

  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return null
  }

  return { x, y }
}
