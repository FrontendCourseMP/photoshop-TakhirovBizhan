import type { AsyncFilterTask, FilterSettings } from '../types'
import { preparePreviewSource, previewKernel3x3InWorker } from '../../image-processing-worker/workerClient'

export function scheduleAsyncFilter(
  source: ImageData,
  settings: FilterSettings,
  onComplete: (imageData: ImageData) => void,
  onError?: () => void,
): AsyncFilterTask {
  let cancelled = false
  const timeoutId: number = window.setTimeout((): void => {
    if (cancelled) {
      return
    }

    // Обработка вынесена в Worker, а флаг cancelled не дает устаревшему preview перезаписать
    // более свежий результат. source передается в Worker один раз на сессию (см. preparePreviewSource),
    // а не на каждое изменение kernel/divisor/offset: сам исходник, пока диалог открыт, не меняется.
    void preparePreviewSource(source)
      .then((): Promise<ImageData> => previewKernel3x3InWorker(settings))
      .then((result: ImageData): void => {
        if (!cancelled) {
          onComplete(result)
        }
      })
      .catch((): void => {
        // Ошибка Worker не должна применять частичный preview; пользователь сможет изменить
        // настройки или закрыть dialog без неконсистентного состояния canvas.
        if (!cancelled) {
          onError?.()
        }
      })
  }, 0)

  return {
    cancel(): void {
      cancelled = true
      window.clearTimeout(timeoutId)
    },
  }
}
