import type { HistogramChannel, HistogramData } from '../histogram/types'
import type { ChannelPreview } from '../image-channels/types'
import type { FilterSettings } from '../image-filters/types'
import type { LevelsState } from '../image-levels/types'
import type { InterpolationMethod } from '../image-resize/types'
import type { ImageSize } from '../../shared/types/imageSize'

export type ImageProcessingTaskType =
  | 'APPLY_LEVELS'
  | 'APPLY_LEVELS_PREVIEW'
  | 'BUILD_LEVELS_HISTOGRAM'
  | 'APPLY_3X3_FILTER'
  | 'RESIZE_IMAGE'
  | 'BUILD_HISTOGRAM'
  | 'BUILD_CHANNEL_PREVIEWS'

interface ImageProcessingRequestBase {
  readonly taskId: number
  readonly type: ImageProcessingTaskType
}

export interface ApplyLevelsWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'APPLY_LEVELS'
  readonly source: ImageData
  readonly levelsState: LevelsState
}

export interface BuildLevelsHistogramWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'BUILD_LEVELS_HISTOGRAM'
  readonly source: ImageData
  readonly levelsState: LevelsState
  readonly channel: HistogramChannel
}

export interface ApplyLevelsPreviewWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'APPLY_LEVELS_PREVIEW'
  readonly source: ImageData
  readonly levelsState: LevelsState
  readonly histogramChannel: HistogramChannel
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

export interface BuildChannelPreviewsWorkerRequest extends ImageProcessingRequestBase {
  readonly type: 'BUILD_CHANNEL_PREVIEWS'
  readonly source: ImageData
}

export type ImageProcessingWorkerRequest =
  | ApplyLevelsWorkerRequest
  | ApplyLevelsPreviewWorkerRequest
  | BuildLevelsHistogramWorkerRequest
  | Apply3x3FilterWorkerRequest
  | ResizeImageWorkerRequest
  | BuildHistogramWorkerRequest
  | BuildChannelPreviewsWorkerRequest

export interface LevelsPreviewWorkerResult {
  readonly imageData: ImageData
  readonly histogram: HistogramData
}

export type ImageProcessingWorkerResult = ImageData | HistogramData | LevelsPreviewWorkerResult | readonly ChannelPreview[]

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
