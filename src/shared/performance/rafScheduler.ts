export interface RafPreviewScheduler {
  readonly schedulePreviewUpdate: (task: () => void) => void
  readonly cancelPreviewUpdate: () => void
}

export function createRafPreviewScheduler(): RafPreviewScheduler {
  // frameId и pendingTask хранятся в closure, поэтому scheduler можно использовать из hooks
  // без React state и без лишних render при каждом движении ползунка.
  let frameId: number | null = null
  let pendingTask: (() => void) | null = null

  return {
    schedulePreviewUpdate(task: () => void): void {
      // Задача заменяется на самую свежую, но уже запрошенный кадр не отменяется.
      // События input приходят чаще, чем раз в кадр, и перезапрос кадра на каждом из них
      // отодвигал бы preview до конца перетаскивания вместо одного пересчета на кадр.
      pendingTask = task

      if (frameId !== null) {
        return
      }

      frameId = requestAnimationFrame((): void => {
        frameId = null

        const scheduledTask: (() => void) | null = pendingTask
        pendingTask = null
        scheduledTask?.()
      })
    },

    cancelPreviewUpdate(): void {
      // Отмена нужна при закрытии dialog или выключении preview, чтобы отложенная
      // задача не записала устаревший ImageData после смены состояния.
      pendingTask = null

      if (frameId === null) {
        return
      }

      cancelAnimationFrame(frameId)
      frameId = null
    },
  }
}
