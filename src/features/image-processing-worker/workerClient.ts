import type { HistogramChannel, HistogramData } from '../histogram/types'
import type { ChannelPreview } from '../image-channels/types'
import type { FilterSettings } from '../image-filters/types'
import type { LevelsState } from '../image-levels/types'
import type { InterpolationMethod } from '../image-resize/types'
import type { ImageSize } from '../../shared/types/imageSize'
import type {
  ImageProcessingWorkerRequest,
  ImageProcessingWorkerResponse,
  ImageProcessingWorkerResult,
  LevelsPreviewWorkerResult,
} from './types'

interface PreparedImageData {
  readonly imageData: ImageData
  readonly transfer: readonly Transferable[]
}

interface PendingWorkerTask {
  readonly resolve: (result: ImageProcessingWorkerResult) => void
  readonly reject: (error: Error) => void
}

let workerInstance: Worker | null = null
let nextTaskId = 1

const pendingTasks: Map<number, PendingWorkerTask> = new Map()

export function applyLevelsInWorker(source: ImageData, levelsState: LevelsState): Promise<ImageData> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'APPLY_LEVELS',
      source: preparedSource.imageData,
      levelsState,
    },
    preparedSource.transfer,
  ).then(assertImageDataResult)
}

export function calculateLevelsHistogramInWorker(
  source: ImageData,
  levelsState: LevelsState,
  channel: HistogramChannel,
): Promise<HistogramData> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'BUILD_LEVELS_HISTOGRAM',
      source: preparedSource.imageData,
      levelsState,
      channel,
    },
    preparedSource.transfer,
  ).then(assertHistogramResult)
}

export function applyLevelsPreviewInWorker(
  source: ImageData,
  levelsState: LevelsState,
  histogramChannel: HistogramChannel,
): Promise<LevelsPreviewWorkerResult> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'APPLY_LEVELS_PREVIEW',
      source: preparedSource.imageData,
      levelsState,
      histogramChannel,
    },
    preparedSource.transfer,
  ).then(assertLevelsPreviewResult)
}

export function applyKernel3x3InWorker(source: ImageData, settings: FilterSettings): Promise<ImageData> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'APPLY_3X3_FILTER',
      source: preparedSource.imageData,
      settings,
    },
    preparedSource.transfer,
  ).then(assertImageDataResult)
}

export function resizeImageInWorker(
  source: ImageData,
  targetSize: ImageSize,
  method: InterpolationMethod,
): Promise<ImageData> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'RESIZE_IMAGE',
      source: preparedSource.imageData,
      targetSize,
      method,
    },
    preparedSource.transfer,
  ).then(assertImageDataResult)
}

export function calculateHistogramInWorker(source: ImageData, channel: HistogramChannel): Promise<HistogramData> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'BUILD_HISTOGRAM',
      source: preparedSource.imageData,
      channel,
    },
    preparedSource.transfer,
  ).then(assertHistogramResult)
}

export function createChannelPreviewsInWorker(source: ImageData): Promise<readonly ChannelPreview[]> {
  const preparedSource: PreparedImageData = prepareImageDataForWorker(source)

  return runWorkerTask(
    {
      taskId: createTaskId(),
      type: 'BUILD_CHANNEL_PREVIEWS',
      source: preparedSource.imageData,
    },
    preparedSource.transfer,
  ).then(assertChannelPreviewsResult)
}

function runWorkerTask(
  request: ImageProcessingWorkerRequest,
  transfer: readonly Transferable[],
): Promise<ImageProcessingWorkerResult> {
  const worker: Worker = getWorker()

  return new Promise((resolve, reject): void => {
    pendingTasks.set(request.taskId, { resolve, reject })

    // В worker передается копия ImageData, а не оригинал редактора.
    // Ее ArrayBuffer можно transfer-ить без риска сломать cancel/reset/source sampling.
    worker.postMessage(request, [...transfer])
  })
}

function getWorker(): Worker {
  if (workerInstance !== null) {
    return workerInstance
  }

  workerInstance = new Worker(new URL('./imageProcessing.worker.ts', import.meta.url), {
    type: 'module',
  })

  workerInstance.addEventListener('message', handleWorkerMessage)
  workerInstance.addEventListener('error', handleWorkerError)

  return workerInstance
}

function handleWorkerMessage(event: MessageEvent<ImageProcessingWorkerResponse>): void {
  const response: ImageProcessingWorkerResponse = event.data
  const pendingTask: PendingWorkerTask | undefined = pendingTasks.get(response.taskId)

  if (pendingTask === undefined) {
    return
  }

  pendingTasks.delete(response.taskId)

  if (response.ok) {
    pendingTask.resolve(response.result)
    return
  }

  pendingTask.reject(new Error(response.errorMessage))
}

function handleWorkerError(event: ErrorEvent): void {
  const error: Error = new Error(event.message || 'Image processing worker failed.')

  // Если worker упал на уровне runtime, все ожидающие задачи считаются ошибочными.
  // Это не дает UI зависнуть в состоянии бесконечного preview/apply ожидания.
  for (const pendingTask of pendingTasks.values()) {
    pendingTask.reject(error)
  }

  pendingTasks.clear()
  workerInstance?.terminate()
  workerInstance = null
}

function prepareImageDataForWorker(source: ImageData): PreparedImageData {
  const buffer: ArrayBuffer = new ArrayBuffer(source.data.length)
  const data: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(buffer)
  data.set(source.data)

  return {
    imageData: new ImageData(data, source.width, source.height),
    transfer: [buffer],
  }
}

function createTaskId(): number {
  const taskId: number = nextTaskId
  nextTaskId += 1

  return taskId
}

function assertImageDataResult(result: ImageProcessingWorkerResult): ImageData {
  if (result instanceof ImageData) {
    return result
  }

  throw new Error('Worker returned an unexpected ImageData result.')
}

function assertHistogramResult(result: ImageProcessingWorkerResult): HistogramData {
  if (result instanceof Uint32Array) {
    return result
  }

  throw new Error('Worker returned an unexpected histogram result.')
}

function assertLevelsPreviewResult(result: ImageProcessingWorkerResult): LevelsPreviewWorkerResult {
  if (isLevelsPreviewWorkerResult(result)) {
    return result
  }

  throw new Error('Worker returned an unexpected Levels preview result.')
}

function isLevelsPreviewWorkerResult(result: ImageProcessingWorkerResult): result is LevelsPreviewWorkerResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    !(result instanceof ImageData) &&
    !(result instanceof Uint32Array) &&
    !Array.isArray(result)
  )
}

function assertChannelPreviewsResult(result: ImageProcessingWorkerResult): readonly ChannelPreview[] {
  if (Array.isArray(result)) {
    return result
  }

  throw new Error('Worker returned an unexpected channel previews result.')
}
