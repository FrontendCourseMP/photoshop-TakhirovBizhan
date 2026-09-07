import { useEffect, useRef, useState } from 'react'
import { applyChannelsInWorker } from '../../image-processing-worker/workerClient'
import { hasActiveChannelMask } from '../lib/imageChannels'
import type { ChannelsState } from '../types'

interface UseChannelMaskOptions {
  readonly baseImageData: ImageData | null
  readonly channels: ChannelsState
  readonly hasAlphaChannel: boolean
  readonly onProcessingChange?: (isPending: boolean) => void
}

/**
 * Накладывает маску каналов на baseImageData через Worker и отдает готовый кадр для canvas.
 * Пока не погашен ни один канал, applyChannelsToImageData вернула бы baseImageData побайтово
 * неизменной (см. hasActiveChannelMask) - в этом случае Worker не вызывается вовсе.
 */
export function useChannelMask({
  baseImageData,
  channels,
  hasAlphaChannel,
  onProcessingChange,
}: UseChannelMaskOptions): ImageData | null {
  const needsMask: boolean = hasActiveChannelMask(channels)
  const [maskedImageData, setMaskedImageData] = useState<ImageData | null>(null)
  // Актуальность ответа Worker проверяется по этой ссылке, а не по самому ответу:
  // пока считается один кадр, пользователь мог успеть переключить канал еще раз.
  const taskIdRef = useRef<number>(0)

  useEffect((): void => {
    if (!needsMask || baseImageData === null) {
      // Инвалидирует уже запущенную задачу: ее результат больше не нужен экрану.
      taskIdRef.current += 1
      return
    }

    const taskId: number = taskIdRef.current + 1
    taskIdRef.current = taskId
    onProcessingChange?.(true)

    void applyChannelsInWorker(baseImageData, channels, hasAlphaChannel)
      .then((result: ImageData): void => {
        if (taskIdRef.current === taskId) {
          setMaskedImageData(result)
        }
      })
      .catch((): void => {
        // Оставляем предыдущий кадр: погасить canvas на ошибке хуже, чем показать старое состояние.
      })
      .finally((): void => {
        if (taskIdRef.current === taskId) {
          onProcessingChange?.(false)
        }
      })
  }, [needsMask, baseImageData, channels, hasAlphaChannel, onProcessingChange])

  // Пока Worker считает маску для нового кадра, canvas остается на предыдущем результате
  // (или на baseImageData, если маска еще ни разу не считалась), а не гаснет на время запроса.
  return needsMask ? (maskedImageData ?? baseImageData) : baseImageData
}
