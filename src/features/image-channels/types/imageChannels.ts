// Панель каналов оперирует двумя разными сущностями: ColorChannel - это байт внутри ImageData,
// который можно погасить, а ChannelSlot - плитка панели, которая может гасить сразу несколько байтов.
export type ColorChannel = 'red' | 'green' | 'blue' | 'alpha'

// Каждый вид миниатюры читает ровно одну величину пикселя, поэтому превью всегда монохромное.
export type ChannelPreviewKind = 'luma' | 'red' | 'green' | 'blue' | 'alpha'

export interface ChannelsState {
  // true означает, что канал участвует в отображаемой копии ImageData.
  readonly red: boolean
  readonly green: boolean
  readonly blue: boolean
  readonly alpha: boolean
}

export interface ChannelPreviewImage {
  // Миниатюра приходит из Worker уже уменьшенной, kind связывает ее с плиткой панели.
  readonly kind: ChannelPreviewKind
  readonly imageData: ImageData
}

export interface ChannelSlot {
  // linkedChannels нужен для grayscale-изображений: одна плитка яркости гасит сразу red, green и blue,
  // потому что отдельных цветовых компонент в таком файле нет.
  readonly kind: ChannelPreviewKind
  readonly label: string
  readonly linkedChannels: readonly ColorChannel[]
}

export interface ChannelLayout {
  // Раскладка фиксирует число каналов, реально существующих в формате файла:
  // 1 (grayscale), 2 (grayscale + alpha), 3 (RGB) или 4 (RGB + alpha).
  readonly title: string
  readonly hasAlpha: boolean
  readonly slots: readonly ChannelSlot[]
}
