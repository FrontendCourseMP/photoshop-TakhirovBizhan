import { useEffect, useRef, useState } from 'react'
import type { AsyncFilterTask, FilterSettings } from '../types'
import { scheduleAsyncFilter } from '../lib/asyncFiltering'
import { DEFAULT_FILTER_SETTINGS } from '../model/kernels'

interface UseFiltersDialogOptions {
  readonly sourceImageData: ImageData
  readonly onPreviewChange: (imageData: ImageData | null) => void
}

interface UseFiltersDialogResult {
  readonly settings: FilterSettings
  readonly isProcessing: boolean
  readonly updateSettings: (settings: FilterSettings) => void
  readonly resetSettings: () => void
}

export function useFiltersDialog({
  sourceImageData,
  onPreviewChange,
}: UseFiltersDialogOptions): UseFiltersDialogResult {
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const activeTaskRef = useRef<AsyncFilterTask | null>(null)

  useEffect((): (() => void) => {
    activeTaskRef.current?.cancel()

    if (!settings.previewEnabled) {
      onPreviewChange(null)

      return (): void => {
        activeTaskRef.current?.cancel()
      }
    }

    activeTaskRef.current = scheduleAsyncFilter(sourceImageData, settings, (preview: ImageData): void => {
      setIsProcessing(false)
      onPreviewChange(preview)
    })

    return (): void => {
      activeTaskRef.current?.cancel()
    }
  }, [onPreviewChange, settings, sourceImageData])

  function resetSettings(): void {
    setIsProcessing(DEFAULT_FILTER_SETTINGS.previewEnabled)
    setSettings(DEFAULT_FILTER_SETTINGS)
  }

  function updateSettings(nextSettings: FilterSettings): void {
    setIsProcessing(nextSettings.previewEnabled)
    setSettings(nextSettings)
  }

  return {
    settings,
    isProcessing,
    updateSettings,
    resetSettings,
  }
}
