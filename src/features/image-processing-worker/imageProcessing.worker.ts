import { calculateHistogram } from '../histogram/lib/calculateHistogram'
import { applyChannelsToImageData } from '../image-channels/lib/imageChannels'
import { applyKernel3x3 } from '../image-filters/lib/applyKernel'
import { applyLevels } from '../image-levels/lib/applyLevels'
import { resizeImage } from '../image-resize/lib/resizeAlgorithms'
import type {
  ImageProcessingWorkerRequest,
  ImageProcessingWorkerResponse,
  ImageProcessingWorkerResult,
} from './types'

interface ImageProcessingWorkerGlobalScope {
  readonly addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<ImageProcessingWorkerRequest>) => void,
  ) => void
  readonly postMessage: (message: ImageProcessingWorkerResponse, transfer?: readonly Transferable[]) => void
}

const workerScope: ImageProcessingWorkerGlobalScope = self as unknown as ImageProcessingWorkerGlobalScope

// Кадр для live-preview (Levels/Filters): сохраняется один раз через PREPARE_PREVIEW_SOURCE,
// а PREVIEW_LEVELS/PREVIEW_3X3_FILTER на каждый кадр перетаскивания используют уже его,
// не пересылая исходник заново из main thread.
let cachedPreviewSource: ImageData | null = null

workerScope.addEventListener('message', (event: MessageEvent<ImageProcessingWorkerRequest>): void => {
  const request: ImageProcessingWorkerRequest = event.data

  try {
    const result: ImageProcessingWorkerResult = runImageProcessingTask(request)
    const response: ImageProcessingWorkerResponse = {
      taskId: request.taskId,
      ok: true,
      result,
    }

    // Worker возвращает ownership больших ArrayBuffer обратно в main thread.
    // Это уменьшает лишнее копирование при передаче ImageData и histogram-данных.
    workerScope.postMessage(response, collectTransferables(result))
  } catch (cause: unknown) {
    const response: ImageProcessingWorkerResponse = {
      taskId: request.taskId,
      ok: false,
      errorMessage: cause instanceof Error ? cause.message : 'Unknown image processing worker error.',
    }

    workerScope.postMessage(response)
  }
})

function runImageProcessingTask(request: ImageProcessingWorkerRequest): ImageProcessingWorkerResult {
  if (request.type === 'APPLY_LEVELS') {
    return applyLevels(request.source, request.levelsState)
  }

  if (request.type === 'APPLY_3X3_FILTER') {
    return applyKernel3x3(request.source, request.settings)
  }

  if (request.type === 'RESIZE_IMAGE') {
    return resizeImage(request.source, request.targetSize, request.method)
  }

  if (request.type === 'BUILD_HISTOGRAM') {
    return calculateHistogram(request.source, request.channel)
  }

  if (request.type === 'APPLY_CHANNELS') {
    return applyChannelsToImageData(request.source, request.channels, request.hasAlphaChannel)
  }

  if (request.type === 'PREPARE_PREVIEW_SOURCE') {
    cachedPreviewSource = request.source
    return { prepared: true }
  }

  if (request.type === 'PREVIEW_LEVELS') {
    return applyLevels(requireCachedPreviewSource(), request.levelsState)
  }

  return applyKernel3x3(requireCachedPreviewSource(), request.settings)
}

function requireCachedPreviewSource(): ImageData {
  // PREPARE_PREVIEW_SOURCE всегда отправляется раньше первого PREVIEW_* для той же сессии,
  // порядок сообщений одного Worker не может перемешаться - null здесь означает ошибку клиента.
  if (cachedPreviewSource === null) {
    throw new Error('Preview source is not prepared yet.')
  }

  return cachedPreviewSource
}

function collectTransferables(result: ImageProcessingWorkerResult): Transferable[] {
  if (result instanceof ImageData) {
    return [getImageDataBuffer(result)]
  }

  if (result instanceof Uint32Array) {
    return [result.buffer]
  }

  // PreparePreviewSourceAck не содержит пикселей - передавать в transfer list нечего.
  return []
}

function getImageDataBuffer(imageData: ImageData): ArrayBuffer {
  // Все ImageData в этом worker создаются на базе обычного ArrayBuffer.
  // TypeScript видит более широкий ArrayBufferLike, поэтому здесь явно фиксируем контракт.
  return imageData.data.buffer as ArrayBuffer
}
