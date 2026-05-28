import type { ChannelPreview, ChannelPreviewKind, ChannelsState, ColorChannel } from '../types'

interface PreviewDescriptor {
  readonly kind: ChannelPreviewKind
  readonly title: string
  readonly controlledChannel?: ColorChannel
}

const PREVIEW_DESCRIPTORS: readonly PreviewDescriptor[] = [
  { kind: 'grayscale', title: 'Grayscale' },
  { kind: 'alpha', title: 'Alpha', controlledChannel: 'alpha' },
  { kind: 'red', title: 'Red', controlledChannel: 'red' },
  { kind: 'green', title: 'Green', controlledChannel: 'green' },
  { kind: 'blue', title: 'Blue', controlledChannel: 'blue' },
  { kind: 'rgb', title: 'RGB' },
  { kind: 'rgba', title: 'RGBA' },
]

export function applyChannelsToImageData(source: ImageData, channels: ChannelsState): ImageData {
  const output: ImageData = createEmptyImageData(source.width, source.height)
  const onlyAlphaEnabled: boolean = channels.alpha && !channels.red && !channels.green && !channels.blue

  for (let index = 0; index < source.data.length; index += 4) {
    const red: number = source.data[index]
    const green: number = source.data[index + 1]
    const blue: number = source.data[index + 2]
    const alpha: number = source.data[index + 3]

    if (onlyAlphaEnabled) {
      output.data[index] = alpha
      output.data[index + 1] = alpha
      output.data[index + 2] = alpha
      output.data[index + 3] = 255
      continue
    }

    output.data[index] = channels.red ? red : 0
    output.data[index + 1] = channels.green ? green : 0
    output.data[index + 2] = channels.blue ? blue : 0
    output.data[index + 3] = channels.alpha ? alpha : 0
  }

  return output
}

export function createChannelPreviews(source: ImageData): readonly ChannelPreview[] {
  return PREVIEW_DESCRIPTORS.map((descriptor: PreviewDescriptor): ChannelPreview => {
    return {
      ...descriptor,
      imageData: createChannelPreviewImageData(source, descriptor.kind),
    }
  })
}

export function createChannelPreviewImageData(source: ImageData, kind: ChannelPreviewKind): ImageData {
  const output: ImageData = createEmptyImageData(source.width, source.height)

  for (let index = 0; index < source.data.length; index += 4) {
    const red: number = source.data[index]
    const green: number = source.data[index + 1]
    const blue: number = source.data[index + 2]
    const alpha: number = source.data[index + 3]

    writePreviewPixel(output.data, index, kind, red, green, blue, alpha)
  }

  return output
}

function writePreviewPixel(
  output: Uint8ClampedArray,
  index: number,
  kind: ChannelPreviewKind,
  red: number,
  green: number,
  blue: number,
  alpha: number,
): void {
  if (kind === 'red' || kind === 'green' || kind === 'blue' || kind === 'alpha' || kind === 'grayscale') {
    const intensity: number = getPreviewIntensity(kind, red, green, blue, alpha)

    output[index] = intensity
    output[index + 1] = intensity
    output[index + 2] = intensity
    output[index + 3] = 255
    return
  }

  output[index] = red
  output[index + 1] = green
  output[index + 2] = blue
  output[index + 3] = kind === 'rgba' ? alpha : 255
}

function getPreviewIntensity(
  kind: Exclude<ChannelPreviewKind, 'rgb' | 'rgba'>,
  red: number,
  green: number,
  blue: number,
  alpha: number,
): number {
  if (kind === 'red') {
    return red
  }

  if (kind === 'green') {
    return green
  }

  if (kind === 'blue') {
    return blue
  }

  if (kind === 'alpha') {
    return alpha
  }

  return Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
}

function createEmptyImageData(width: number, height: number): ImageData {
  const buffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
  const data: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(buffer)

  return new ImageData(data, width, height)
}
