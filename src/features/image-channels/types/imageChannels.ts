export type ColorChannel = 'red' | 'green' | 'blue' | 'alpha'

export type ChannelPreviewKind = 'grayscale' | 'alpha' | 'red' | 'green' | 'blue' | 'rgb' | 'rgba'

export interface ChannelsState {
  readonly red: boolean
  readonly green: boolean
  readonly blue: boolean
  readonly alpha: boolean
}

export interface ChannelPreview {
  readonly kind: ChannelPreviewKind
  readonly title: string
  readonly imageData: ImageData
  readonly controlledChannel?: ColorChannel
}
