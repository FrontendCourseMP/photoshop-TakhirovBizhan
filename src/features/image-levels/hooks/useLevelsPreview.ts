import { useEffect, useRef } from 'react'
import { createRafPreviewScheduler, type RafPreviewScheduler } from '../../../shared/performance/rafScheduler'
import { applyLevels } from '../lib/applyLevels'
import type { LevelsState } from '../types'

interface UseLevelsPreviewOptions {
  readonly sourceImageData: ImageData
  readonly levelsState: LevelsState
  readonly previewEnabled: boolean
  readonly onPreviewChange: (preview: ImageData | null) => void
}

export function useLevelsPreview({
  sourceImageData,
  levelsState,
  previewEnabled,
  onPreviewChange,
}: UseLevelsPreviewOptions): void {
  // Scheduler живет между render-циклами компонента, чтобы частые input-события
  // не запускали несколько тяжелых пересчетов preview подряд.
  const schedulerRef = useRef<RafPreviewScheduler | null>(null)

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
      onPreviewChange(null)

      return (): void => {
        scheduler.cancelPreviewUpdate()
      }
    }

    scheduler.schedulePreviewUpdate((): void => {
      // Тяжелая обработка пикселей вынесена из render и объединяется в один проход на кадр.
      // Это защищает UI от render storm при перетаскивании slider уровней.
      onPreviewChange(applyLevels(sourceImageData, levelsState))
    })

    return (): void => {
      scheduler.cancelPreviewUpdate()
    }
  }, [levelsState, onPreviewChange, previewEnabled, sourceImageData])
}
