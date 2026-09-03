// Набор каналов фильтра выводится из формата открытого файла.
// Модуль не трогает пиксели: он только решает, что показать в форме и что попадет в settings.
import type { ImageMetadata } from '../../../entities/image/types'
import type { FilterChannel, FilterChannelOption } from '../types'

// Порядок соответствует раскладке байтов в пикселе, поэтому выбор каналов
// всегда сериализуется одинаково независимо от порядка кликов.
const CHANNEL_ORDER: readonly FilterChannel[] = ['red', 'green', 'blue', 'alpha']

const ALPHA_OPTION: FilterChannelOption = {
  id: 'alpha',
  label: 'Alpha',
  channels: ['alpha'],
}

export function resolveFilterChannels(metadata: ImageMetadata): readonly FilterChannelOption[] {
  // Свертка одного цветового компонента grayscale-изображения раскрасила бы результат,
  // поэтому для таких файлов предлагается один тоновый вариант на все три компонента.
  const toneOptions: readonly FilterChannelOption[] =
    metadata.colorMode === 'grayscale'
      ? [{ id: 'luma', label: 'Gray', channels: ['red', 'green', 'blue'] }]
      : [
          { id: 'red', label: 'Red', channels: ['red'] },
          { id: 'green', label: 'Green', channels: ['green'] },
          { id: 'blue', label: 'Blue', channels: ['blue'] },
        ]

  return metadata.hasAlpha ? [...toneOptions, ALPHA_OPTION] : toneOptions
}

export function isFilterOptionSelected(
  option: FilterChannelOption,
  selectedChannels: readonly FilterChannel[],
): boolean {
  // Тоновый вариант считается выбранным только целиком: частичный набор дал бы
  // цветной результат на изображении, где все три компонента равны.
  return option.channels.every((channel: FilterChannel): boolean => selectedChannels.includes(channel))
}

export function toggleFilterOption(
  option: FilterChannelOption,
  selectedChannels: readonly FilterChannel[],
): readonly FilterChannel[] {
  const isSelected: boolean = isFilterOptionSelected(option, selectedChannels)
  const nextChannels: Set<FilterChannel> = new Set(selectedChannels)

  for (const channel of option.channels) {
    if (isSelected) {
      nextChannels.delete(channel)
    } else {
      nextChannels.add(channel)
    }
  }

  return CHANNEL_ORDER.filter((channel: FilterChannel): boolean => nextChannels.has(channel))
}
