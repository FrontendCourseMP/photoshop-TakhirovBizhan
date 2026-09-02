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

interface PreviewRequest {
  readonly sourceImageData: ImageData
  readonly levelsState: LevelsState
}

/**
 * Держит preview главного canvas в соответствии с настройками Levels.
 * Hook ничего не рисует и не меняет изображение редактора: наружу отдается только временный
 * ImageData, а при выключенном preview - null.
 */
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
  // Ссылки переживают перезапуск effect, поэтому по ним видно, актуален ли пришедший
  // результат и не считает ли Worker в этот момент предыдущий кадр.
  const requestedRef = useRef<PreviewRequest | null>(null)
  const dispatchedRef = useRef<PreviewRequest | null>(null)
  const isWorkerBusyRef = useRef<boolean>(false)
  const isPreviewActiveRef = useRef<boolean>(false)

  if (schedulerRef.current === null) {
    schedulerRef.current = createRafPreviewScheduler()
  }

  useEffect((): (() => void) => {
    const scheduler: RafPreviewScheduler = schedulerRef.current ?? createRafPreviewScheduler()
    schedulerRef.current = scheduler
    isPreviewActiveRef.current = previewEnabled
    requestedRef.current = { sourceImageData, levelsState }

    function startPreviewTask(): void {
      const request: PreviewRequest | null = requestedRef.current

      // Пока Worker считает предыдущий кадр, новая задача не ставится в очередь: свежие настройки
      // подхватит continuation после ответа. Иначе на большом изображении canvas отставал бы
      // от ползунка на всю накопленную очередь, а не на один кадр.
      if (request === null || isWorkerBusyRef.current || isSameRequest(request, dispatchedRef.current)) {
        return
      }

      isWorkerBusyRef.current = true
      dispatchedRef.current = request

      void applyLevelsInWorker(request.sourceImageData, request.levelsState)
        .then((preview: ImageData): void => {
          // Устаревший ответ отбрасывается: пользователь уже сдвинул маркер
          // или выключил preview, пока Worker считал кадр.
          if (isPreviewActiveRef.current && isSameRequest(request, requestedRef.current)) {
            onPreviewChange(preview)
            onPreviewPendingChange?.(false)
          }
        })
        .catch((): void => {
          if (isPreviewActiveRef.current && isSameRequest(request, requestedRef.current)) {
            onPreviewChange(null)
            onPreviewPendingChange?.(false)
          }
        })
        .finally((): void => {
          isWorkerBusyRef.current = false

          if (isPreviewActiveRef.current) {
            startPreviewTask()
          }
        })
    }

    if (!previewEnabled) {
      // При выключенном preview главный canvas показывает snapshot до открытия Levels,
      // поэтому наружу отправляется null вместо пересчитанного ImageData.
      scheduler.cancelPreviewUpdate()
      // После повторного включения preview те же настройки нужно посчитать заново,
      // поэтому отметка о последней отправленной задаче снимается.
      dispatchedRef.current = null
      onPreviewPendingChange?.(false)
      onPreviewChange(null)
    } else {
      onPreviewPendingChange?.(true)
      // Тяжелая обработка пикселей вынесена из render и объединяется в один проход на кадр.
      // Это защищает UI от render storm при перетаскивании маркеров уровней.
      scheduler.schedulePreviewUpdate(startPreviewTask)
    }

    return (): void => {
      // Флаг снимается на каждой очистке: после unmount ответ Worker уже не должен вернуть
      // preview на canvas, а при обычной смене настроек effect сразу поднимет его снова.
      isPreviewActiveRef.current = false
      onPreviewPendingChange?.(false)
      scheduler.cancelPreviewUpdate()
    }
  }, [levelsState, onPreviewChange, onPreviewPendingChange, previewEnabled, sourceImageData])
}

function isSameRequest(request: PreviewRequest, other: PreviewRequest | null): boolean {
  // Сравнение по ссылкам достаточно: и ImageData, и LevelsState пересобираются иммутабельно.
  return (
    other !== null &&
    other.sourceImageData === request.sourceImageData &&
    other.levelsState === request.levelsState
  )
}
