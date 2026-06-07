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
  // Hook концентрирует состояние dialog и async preview, чтобы UI-компонент
  // не занимался планированием тяжелой фильтрации и отменой устаревших задач.
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const activeTaskRef = useRef<AsyncFilterTask | null>(null)

  useEffect((): (() => void) => {
    // Любое изменение kernel/divisor/offset делает предыдущий preview устаревшим.
    // Отмена предотвращает ситуацию, когда старый результат приходит позже нового.
    activeTaskRef.current?.cancel()

    if (!settings.previewEnabled) {
      // null означает "покажи исходное изображение", а не результат фильтра.
      onPreviewChange(null)

      return (): void => {
        activeTaskRef.current?.cancel()
      }
    }

    // Фильтр применяется асинхронно, чтобы большие изображения не блокировали
    // React render и не задерживали ввод в полях dialog.
    activeTaskRef.current = scheduleAsyncFilter(
      sourceImageData,
      settings,
      (preview: ImageData): void => {
        setIsProcessing(false)
        onPreviewChange(preview)
      },
      (): void => {
        setIsProcessing(false)
        onPreviewChange(null)
      },
    )

    return (): void => {
      activeTaskRef.current?.cancel()
    }
  }, [onPreviewChange, settings, sourceImageData])

  function resetSettings(): void {
    // Reset возвращает дефолтный preset и сразу переводит UI в состояние обработки,
    // если preview включен в настройках по умолчанию.
    setIsProcessing(DEFAULT_FILTER_SETTINGS.previewEnabled)
    setSettings(DEFAULT_FILTER_SETTINGS)
  }

  function updateSettings(nextSettings: FilterSettings): void {
    // isProcessing включается до старта async-задачи, чтобы пользователь видел,
    // что preview пересчитывается после изменения параметров фильтра.
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
