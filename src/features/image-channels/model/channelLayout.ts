// Набор каналов панели выводится из метаданных открытого файла.
// Пиксели модуль не читает: состав каналов задает формат, а не содержимое изображения.
import type { ImageMetadata } from '../../../entities/image/types'
import type { ChannelLayout, ChannelSlot } from '../types'

// Grayscale-файл хранит одну величину на пиксель, поэтому в canvas ей соответствуют
// сразу три одинаковых компонента RGBA, и гасить их можно только вместе.
const LUMA_SLOT: ChannelSlot = {
  kind: 'luma',
  label: 'Gray',
  linkedChannels: ['red', 'green', 'blue'],
}

const COLOR_SLOTS: readonly ChannelSlot[] = [
  { kind: 'red', label: 'Red', linkedChannels: ['red'] },
  { kind: 'green', label: 'Green', linkedChannels: ['green'] },
  { kind: 'blue', label: 'Blue', linkedChannels: ['blue'] },
]

const ALPHA_SLOT: ChannelSlot = {
  kind: 'alpha',
  label: 'Alpha',
  linkedChannels: ['alpha'],
}

export function resolveChannelLayout(metadata: ImageMetadata): ChannelLayout {
  const isMonochrome: boolean = metadata.colorMode === 'grayscale'
  const colorSlots: readonly ChannelSlot[] = isMonochrome ? [LUMA_SLOT] : COLOR_SLOTS

  return {
    title: buildLayoutTitle(isMonochrome, metadata.hasAlpha),
    hasAlpha: metadata.hasAlpha,
    // Альфа добавляется последней, чтобы порядок плиток совпадал с порядком байтов в пикселе.
    slots: metadata.hasAlpha ? [...colorSlots, ALPHA_SLOT] : colorSlots,
  }
}

function buildLayoutTitle(isMonochrome: boolean, hasAlpha: boolean): string {
  const colorPart: string = isMonochrome ? 'Grayscale' : 'RGB'

  return hasAlpha ? `${colorPart} + alpha` : colorPart
}
