export interface RafPreviewScheduler {
  readonly schedulePreviewUpdate: (task: () => void) => void
  readonly cancelPreviewUpdate: () => void
}

export function createRafPreviewScheduler(): RafPreviewScheduler {
  // frameId хранится в closure, поэтому scheduler можно использовать из hooks
  // без React state и без лишних render при каждом движении slider.
  let frameId: number | null = null

  return {
    schedulePreviewUpdate(task: () => void): void {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }

      // Preview может меняться при каждом движении slider; requestAnimationFrame
      // оставляет только последнюю задачу кадра и снижает нагрузку на UI thread.
      frameId = requestAnimationFrame((): void => {
        frameId = null
        task()
      })
    },

    cancelPreviewUpdate(): void {
      // Отмена нужна при закрытии dialog или выключении preview, чтобы отложенная
      // задача не записала устаревший ImageData после смены состояния.
      if (frameId === null) {
        return
      }

      cancelAnimationFrame(frameId)
      frameId = null
    },
  }
}
