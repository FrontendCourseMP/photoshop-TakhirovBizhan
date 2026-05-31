import type { AsyncFilterTask, FilterSettings } from '../types'
import { applyKernel3x3 } from './applyKernel'

export function scheduleAsyncFilter(
  source: ImageData,
  settings: FilterSettings,
  onComplete: (imageData: ImageData) => void,
): AsyncFilterTask {
  let cancelled = false
  const timeoutId: number = window.setTimeout((): void => {
    if (cancelled) {
      return
    }

    // Обработка вынесена из input-события, чтобы быстрые изменения настроек не блокировали UI синхронно.
    const result: ImageData = applyKernel3x3(source, settings)

    if (!cancelled) {
      onComplete(result)
    }
  }, 0)

  return {
    cancel(): void {
      cancelled = true
      window.clearTimeout(timeoutId)
    },
  }
}
