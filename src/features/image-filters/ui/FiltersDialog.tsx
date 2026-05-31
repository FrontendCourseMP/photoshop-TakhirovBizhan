import type { ChangeEvent, JSX } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { applyKernel3x3 } from '../lib/applyKernel'
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
}

export function FiltersDialog({
  open,
  sourceImageData,
  onPreviewChange,
  onApply,
  onCancel,
}: FiltersDialogProps): JSX.Element | null {
  const { settings, isProcessing, updateSettings, resetSettings } = useFiltersDialog({
    sourceImageData,
    onPreviewChange,
  })

  function handleCancel(): void {
    onPreviewChange(null)
    onCancel()
  }

  function handleApply(): void {
    onPreviewChange(null)
    onApply(applyKernel3x3(sourceImageData, settings))
  }

  return (
    <Modal open={open} title="Filters 3x3" onClose={handleCancel}>
      <div className="filters-dialog">
        <div className="filters-grid">
          <FilterPresetsSelect
            onPresetSelect={(preset: KernelPreset) => {
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
              updateSettings({
                ...settings,
                previewEnabled: event.currentTarget.checked,
              })
            }}
          />
          Preview
        </label>

        {isProcessing ? <div className="filter-processing">Processing preview...</div> : null}

        <footer className="filter-actions">
          <button type="button" onClick={resetSettings}>
            Reset
          </button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleApply}>
            Apply
          </button>
        </footer>
      </div>
    </Modal>
  )
}
