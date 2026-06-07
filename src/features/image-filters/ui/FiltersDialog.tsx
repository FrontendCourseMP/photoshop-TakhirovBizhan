import { useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { OperationLoader } from '../../../shared/ui/OperationLoader/OperationLoader'
import { applyKernel3x3InWorker } from '../../image-processing-worker/workerClient'
import { useFiltersDialog } from '../hooks/useFiltersDialog'
import type { EdgeHandlingStrategy, Kernel3x3, KernelPreset } from '../types'
import { EdgeHandlingSelect } from './EdgeHandlingSelect'
import { FilterChannels } from './FilterChannels'
import { FilterPresetsSelect } from './FilterPresetsSelect'
import { KernelGrid } from './KernelGrid'

interface FiltersDialogProps {
  readonly open: boolean
  readonly sourceImageData: ImageData
  readonly onPreviewChange: (imageData: ImageData | null) => void
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
  readonly onProcessingChange?: (isPending: boolean) => void
}

export function FiltersDialog({
  open,
  sourceImageData,
  onPreviewChange,
  onApply,
  onCancel,
  onProcessingChange,
}: FiltersDialogProps): JSX.Element | null {
  // Dialog отвечает за форму фильтра, а preview и отмена устаревших расчетов
  // находятся в useFiltersDialog, чтобы UI не содержал pixel-processing логику.
  const { settings, isProcessing, updateSettings, resetSettings } = useFiltersDialog({
    sourceImageData,
    onPreviewChange,
  })
  const [isApplying, setIsApplying] = useState<boolean>(false)

  function handleCancel(): void {
    if (isApplying) {
      return
    }

    // Cancel должен вернуть canvas к исходному snapshot, поэтому preview сбрасывается явно.
    onPreviewChange(null)
    onCancel()
  }

  async function handleApply(): Promise<void> {
    // Apply выполняет финальную фильтрацию один раз. До этого пользователь видит
    // только временный preview, который не мутирует sourceImageData.
    onPreviewChange(null)
    setIsApplying(true)
    onProcessingChange?.(true)

    try {
      onApply(await applyKernel3x3InWorker(sourceImageData, settings))
    } catch {
      // Ошибка Worker не должна закрывать dialog или записывать неполный результат.
      onPreviewChange(null)
    } finally {
      setIsApplying(false)
      onProcessingChange?.(false)
    }
  }

  return (
    <Modal open={open} title="Filters 3x3" onClose={handleCancel}>
      <div className="filters-dialog">
        <div className="filters-grid">
          <FilterPresetsSelect
            onPresetSelect={(preset: KernelPreset) => {
              // Preset заменяет только параметры свертки, сохраняя остальные настройки dialog
              // вроде edge handling, выбранных каналов и preview.
              updateSettings({
                ...settings,
                kernel: preset.kernel,
                divisor: preset.divisor,
                offset: preset.offset,
              })
            }}
          />
          <EdgeHandlingSelect
            value={settings.edgeHandling}
            onChange={(edgeHandling: EdgeHandlingStrategy) => {
              // Edge handling влияет только на чтение соседних пикселей за границей изображения.
              updateSettings({
                ...settings,
                edgeHandling,
              })
            }}
          />
        </div>

        <KernelGrid
          kernel={settings.kernel}
          onKernelChange={(kernel: Kernel3x3) => {
            // Ручное изменение kernel сразу запускает preview через hook.
            updateSettings({
              ...settings,
              kernel,
            })
          }}
        />

        <div className="filters-grid">
          <label className="filter-field">
            <span>Divisor</span>
            <input
              step={0.1}
              type="number"
              value={settings.divisor ?? 1}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                // Divisor нормализует сумму свертки; в lib есть защита от нулевого значения.
                updateSettings({
                  ...settings,
                  divisor: Number(event.currentTarget.value),
                })
              }}
            />
          </label>
          <label className="filter-field">
            <span>Offset</span>
            <input
              step={1}
              type="number"
              value={settings.offset ?? 0}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                // Offset добавляется после свертки и нужен для фильтров вроде emboss.
                updateSettings({
                  ...settings,
                  offset: Number(event.currentTarget.value),
                })
              }}
            />
          </label>
        </div>

        <FilterChannels
          selectedChannels={settings.selectedChannels}
          onChannelsChange={(selectedChannels) => {
            // Маска каналов позволяет применять kernel только к выбранным компонентам RGBA.
            updateSettings({
              ...settings,
              selectedChannels,
            })
          }}
        />

        <label className="filter-preview-toggle">
          <input
            checked={settings.previewEnabled}
            type="checkbox"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              // Выключенный preview сообщает page-слою null, и canvas показывает исходное imageData.
              updateSettings({
                ...settings,
                previewEnabled: event.currentTarget.checked,
              })
            }}
          />
          Preview
        </label>

        <OperationLoader active={isProcessing || isApplying} label={isApplying ? 'Applying filter...' : 'Processing preview...'} />

        <footer className="filter-actions">
          <button type="button" disabled={isApplying} onClick={resetSettings}>
            Reset
          </button>
          <button type="button" disabled={isApplying} onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            disabled={isApplying}
            onClick={() => {
              void handleApply()
            }}
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        </footer>
      </div>
    </Modal>
  )
}
