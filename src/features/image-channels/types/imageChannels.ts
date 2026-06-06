// ColorChannel описывает управляемые компоненты RGBA, которые можно включать/выключать.
export type ColorChannel = 'red' | 'green' | 'blue' | 'alpha'

// PreviewKind шире, чем ColorChannel: часть миниатюр показывает производные представления
// вроде grayscale, rgb и rgba, которые не являются отдельными переключателями.
export type ChannelPreviewKind = 'grayscale' | 'alpha' | 'red' | 'green' | 'blue' | 'rgb' | 'rgba'

export interface ChannelsState {
  // true означает, что канал участвует в отображаемой копии ImageData.
  readonly red: boolean
  readonly green: boolean
  readonly blue: boolean
  readonly alpha: boolean
}

export interface ChannelPreview {
  // controlledChannel связывает preview с checkbox, чтобы UI мог подсветить inactive state.
  readonly kind: ChannelPreviewKind
  readonly title: string
  readonly imageData: ImageData
  readonly controlledChannel?: ColorChannel
}
