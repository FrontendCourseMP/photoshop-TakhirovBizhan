export interface RafPreviewScheduler {
  readonly schedulePreviewUpdate: (task: () => void) => void
  readonly cancelPreviewUpdate: () => void
}

export function createRafPreviewScheduler(): RafPreviewScheduler {
  let frameId: number | null = null

  return {
    schedulePreviewUpdate(task: () => void): void {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }

      // Preview может меняться при каждом движении slider; requestAnimationFrame оставляет только последнюю задачу кадра.
      frameId = requestAnimationFrame((): void => {
        frameId = null
        task()
      })
    },

    cancelPreviewUpdate(): void {
      if (frameId === null) {
        return
      }

      cancelAnimationFrame(frameId)
      frameId = null
    },
  }
}
