import type { HistogramChannel, HistogramData } from '../histogram/types'
import type { ChannelsState } from '../image-channels/types'
import type { FilterSettings } from '../image-filters/types'
import type { LevelsState } from '../image-levels/types'
import type { InterpolationMethod } from '../image-resize/types'
import type { ImageSize } from '../../shared/types/imageSize'

export type ImageProcessingTaskType =
  | 'APPLY_LEVELS'
  | 'APPLY_3X3_FILTER'
  | 'RESIZE_IMAGE'
  | 'BUILD_HISTOGRAM'
  | 'APPLY_CHANNELS'
  | 'PREPARE_PREVIEW_SOURCE'
  | 'PREVIEW_LEVELS'
  | 'PREVIEW_3X3_FILTER'

interface ImageProcessingRequestBase {
  readonly taskId: number
  readonly type: ImageProcessingTaskType
}

export interface ApplyLevelsWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'APPLY_LEVELS'
  readonly source: ImageData
  readonly levelsState: LevelsState
}

export interface Apply3x3FilterWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'APPLY_3X3_FILTER'
  readonly source: ImageData
  readonly settings: FilterSettings
}

export interface ResizeImageWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'RESIZE_IMAGE'
  readonly source: ImageData
  readonly targetSize: ImageSize
  readonly method: InterpolationMethod
}

export interface BuildHistogramWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'BUILD_HISTOGRAM'
  readonly source: ImageData
  readonly channel: HistogramChannel
}

export interface ApplyChannelsWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'APPLY_CHANNELS'
  readonly source: ImageData
  readonly channels: ChannelsState
  readonly hasAlphaChannel: boolean
}

// Готовит кадр для серии live-preview запросов (Levels/Filters): Worker запоминает его
// один раз на сессию, поэтому PREVIEW_* сообщения ниже не таскают исходник на каждый кадр.
export interface PreparePreviewSourceWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'PREPARE_PREVIEW_SOURCE'
  readonly source: ImageData
}

export interface PreviewLevelsWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'PREVIEW_LEVELS'
  readonly levelsState: LevelsState
}

export interface Preview3x3FilterWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'PREVIEW_3X3_FILTER'
  readonly settings: FilterSettings
}

export type ImageProcessingWorkerRequest =
  | ApplyLevelsWorkerRequest
  | Apply3x3FilterWorkerRequest
  | ResizeImageWorkerRequest
  | BuildHistogramWorkerRequest
  | ApplyChannelsWorkerRequest
  | PreparePreviewSourceWorkerRequest
  | PreviewLevelsWorkerRequest
  | Preview3x3FilterWorkerRequest

// Ack не переносит пиксели - только подтверждает, что Worker сохранил кадр для PREVIEW_* запросов.
export interface PreparePreviewSourceAck {
  readonly prepared: true
}

export type ImageProcessingWorkerResult = ImageData | HistogramData | PreparePreviewSourceAck

export interface ImageProcessingWorkerSuccess {
  readonly taskId: number
  readonly ok: true
  readonly result: ImageProcessingWorkerResult
}

export interface ImageProcessingWorkerFailure {
  readonly taskId: number
  readonly ok: false
  readonly errorMessage: string
}

export type ImageProcessingWorkerResponse = ImageProcessingWorkerSuccess | ImageProcessingWorkerFailure
