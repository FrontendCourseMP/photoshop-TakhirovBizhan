import type { ImageCoordinates } from '../types'

export function getCanvasImageCoordinates(event: MouseEvent, canvas: HTMLCanvasElement): ImageCoordinates | null {
  // DOMRect описывает CSS-размер canvas на экране, который может отличаться
  // от реального backing size canvas.width/canvas.height.
  const rect: DOMRect = canvas.getBoundingClientRect()

  // Клики вне видимой области canvas игнорируются до пересчета координат,
  // чтобы пипетка не читала пиксели за пределами изображения.
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

  // scaleX/scaleY переводят координаты окна браузера в координаты исходного ImageData.
  // Это обязательно при zoom/display scale, иначе пипетка будет выбирать соседний пиксель.
  const scaleX: number = canvas.width / rect.width
  const scaleY: number = canvas.height / rect.height
  const x: number = Math.floor((event.clientX - rect.left) * scaleX)
  const y: number = Math.floor((event.clientY - rect.top) * scaleY)

  // Повторная проверка нужна из-за округления Math.floor и пограничных кликов
  // по правой/нижней границе canvas.
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return null
  }

  return { x, y }
}
