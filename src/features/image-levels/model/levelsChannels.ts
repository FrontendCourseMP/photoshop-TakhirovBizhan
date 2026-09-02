import type { ImageMetadata } from '../../../entities/image/types'
import type { LevelsChannelOption } from '../types'

/**
 * Собирает список каналов Levels по формату открытого файла.
 * Значения соответствуют ключам LevelsState, поэтому уже введенные настройки при смене
 * выбранного канала не теряются.
 */
export function resolveLevelsChannels(metadata: ImageMetadata): readonly LevelsChannelOption[] {
  // У grayscale-файла нет отдельных цветовых компонент: master для него - единственный
  // тоновый канал, поэтому предлагать Red, Green и Blue нечего.
  const toneOptions: readonly LevelsChannelOption[] =
    metadata.colorMode === 'grayscale'
      ? [{ channel: 'master', label: 'Gray' }]
      : [
          { channel: 'master', label: 'Master (RGB)' },
          { channel: 'red', label: 'Red' },
          { channel: 'green', label: 'Green' },
          { channel: 'blue', label: 'Blue' },
        ]

  return metadata.hasAlpha ? [...toneOptions, { channel: 'alpha', label: 'Alpha' }] : toneOptions
}
