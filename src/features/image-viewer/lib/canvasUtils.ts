import { createFileProcessingError } from '../../../entities/image/lib/errors'
import type { FileProcessingError } from '../../../entities/image/types'

export function getCanvasRenderingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  if (context === null) {
    throw createFileProcessingError('CANVAS_CONTEXT_UNAVAILABLE', '2D canvas context is unavailable.')
  }

  return context
}

export function drawImageDataToCanvas(canvas: HTMLCanvasElement, imageData: ImageData): void {
  const context: CanvasRenderingContext2D = getCanvasRenderingContext(canvas)

  canvas.width = imageData.width
  canvas.height = imageData.height
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.putImageData(imageData, 0, 0)
}

export async function readBrowserImageData(file: File): Promise<ImageData> {
  let bitmap: ImageBitmap

  try {
    // PNG/JPG декодируются браузером, чтобы не дублировать уже встроенную поддержку форматов.
    bitmap = await createImageBitmap(file)
  } catch (cause: unknown) {
    throw createFileProcessingError('IMAGE_DECODE_FAILED', 'Browser failed to decode the image file.', cause)
  }

  try {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context: CanvasRenderingContext2D = getCanvasRenderingContext(canvas)
    context.drawImage(bitmap, 0, 0)

    return context.getImageData(0, 0, canvas.width, canvas.height)
  } finally {
    bitmap.close()
  }
}

export async function imageDataToBlob(
  imageData: ImageData,
  mimeType: 'image/png' | 'image/jpeg',
  quality?: number,
): Promise<Blob> {
  const canvas: HTMLCanvasElement = document.createElement('canvas')
  drawImageDataToCanvas(canvas, imageData)

  // Canvas API экспортирует PNG/JPEG асинхронно через callback, поэтому оборачиваем его в Promise.
  return new Promise<Blob>((resolve: (blob: Blob) => void, reject: (reason: FileProcessingError) => void) => {
    canvas.toBlob(
      (blob: Blob | null): void => {
        if (blob === null) {
          reject(createFileProcessingError('CANVAS_EXPORT_FAILED', `Failed to export image as ${mimeType}.`))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}
