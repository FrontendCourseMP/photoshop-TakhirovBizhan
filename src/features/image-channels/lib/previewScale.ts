/**
 * Уменьшает изображение до размера миниатюры через canvas.drawImage (аппаратный downscale).
 * Требует document, поэтому работает только в main thread - изнутри Worker вызвать ее нельзя.
 */
export function fitImageDataToBox(source: ImageData, maxSide: number): ImageData {
  const longestSide: number = Math.max(source.width, source.height)

  // Изображение меньше ограничения возвращается как есть: уменьшать нечего.
  if (!Number.isFinite(maxSide) || maxSide <= 0 || longestSide <= maxSide) {
    return source
  }

  const reduction: number = longestSide / maxSide
  const width: number = Math.max(Math.round(source.width / reduction), 1)
  const height: number = Math.max(Math.round(source.height / reduction), 1)

  // Полноразмерный canvas нужен только как источник для drawImage - сам он никуда не выводится.
  const sourceCanvas: HTMLCanvasElement = document.createElement('canvas')
  sourceCanvas.width = source.width
  sourceCanvas.height = source.height
  getContext(sourceCanvas).putImageData(source, 0, 0)

  const targetCanvas: HTMLCanvasElement = document.createElement('canvas')
  targetCanvas.width = width
  targetCanvas.height = height
  const targetContext: CanvasRenderingContext2D = getContext(targetCanvas)
  targetContext.drawImage(sourceCanvas, 0, 0, width, height)

  return targetContext.getImageData(0, 0, width, height)
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d', { willReadFrequently: true })

  if (context === null) {
    throw new Error('2D canvas context is unavailable.')
  }

  return context
}
