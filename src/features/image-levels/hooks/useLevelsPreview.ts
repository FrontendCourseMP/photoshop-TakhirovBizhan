import { useEffect, useRef } from 'react'
import { createRafPreviewScheduler, type RafPreviewScheduler } from '../../../shared/performance/rafScheduler'
import { applyLevelsInWorker } from '../../image-processing-worker/workerClient'
import type { LevelsState } from '../types'

interface UseLevelsPreviewOptions {
  readonly sourceImageData: ImageData
  readonly levelsState: LevelsState
  readonly previewEnabled: boolean
  readonly onPreviewChange: (preview: ImageData | null) => void
  readonly onPreviewPendingChange?: (isPending: boolean) => void
}

export function useLevelsPreview({
  sourceImageData,
  levelsState,
  previewEnabled,
  onPreviewChange,
  onPreviewPendingChange,
}: UseLevelsPreviewOptions): void {
  // Scheduler живет между render-циклами компонента, чтобы частые input-события
  // не запускали несколько тяжелых пересчетов preview подряд.
  const schedulerRef = useRef<RafPreviewScheduler | null>(null)
  const activeTaskIdRef = useRef<number>(0)

  if (schedulerRef.current === null) {
    schedulerRef.current = createRafPreviewScheduler()
  }

  useEffect((): (() => void) => {
    const scheduler: RafPreviewScheduler = schedulerRef.current ?? createRafPreviewScheduler()
    schedulerRef.current = scheduler

    if (!previewEnabled) {
      // При выключенном preview главный canvas должен показывать snapshot до открытия Levels,
      // поэтому наружу отправляется null вместо пересчитанного ImageData.
      scheduler.cancelPreviewUpdate()
      activeTaskIdRef.current += 1
      onPreviewPendingChange?.(false)
      onPreviewChange(null)

      return (): void => {
        scheduler.cancelPreviewUpdate()
        onPreviewPendingChange?.(false)
      }
    }

    const taskId: number = activeTaskIdRef.current + 1
    activeTaskIdRef.current = taskId
    onPreviewPendingChange?.(true)

    scheduler.schedulePreviewUpdate((): void => {
      // Тяжелая обработка пикселей вынесена из render и объединяется в один проход на кадр.
      // Это защищает UI от render storm при перетаскивании slider уровней.
      void applyLevelsInWorker(sourceImageData, levelsState)
        .then((preview: ImageData): void => {
          // taskId защищает от гонок: старый ответ Worker игнорируется,
          // если пользователь уже изменил настройки Levels.
          if (activeTaskIdRef.current === taskId) {
            onPreviewChange(preview)
            onPreviewPendingChange?.(false)
          }
        })
        .catch((): void => {
          if (activeTaskIdRef.current === taskId) {
            onPreviewChange(null)
            onPreviewPendingChange?.(false)
          }
        })
    })

    return (): void => {
      activeTaskIdRef.current += 1
      onPreviewPendingChange?.(false)
      scheduler.cancelPreviewUpdate()
    }
  }, [levelsState, onPreviewChange, onPreviewPendingChange, previewEnabled, sourceImageData])
}
