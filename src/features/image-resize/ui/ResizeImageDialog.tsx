import { useMemo, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import type { ImageSize } from '../../../shared/types/imageSize'
import {
  calculateAspectRatioSize,
  calculateResizeStats,
  getTargetSizeFromSettings,
  validateResizeSettings,
} from '../lib/resizeValidation'
import { resizeImage } from '../lib/resizeAlgorithms'
import { DEFAULT_RESIZE_METHOD, INTERPOLATION_ALGORITHMS } from '../model/resizeConstants'
import type { InterpolationAlgorithm, InterpolationMethod, ResizeSettings, ResizeStats, ResizeValidationResult } from '../types'

interface ResizeImageDialogProps {
  readonly open: boolean
  readonly sourceImageData: ImageData
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
}

export function ResizeImageDialog({
  open,
  sourceImageData,
  onApply,
  onCancel,
}: ResizeImageDialogProps): JSX.Element | null {
  const sourceSize: ImageSize = useMemo((): ImageSize => {
    return {
      width: sourceImageData.width,
      height: sourceImageData.height,
    }
  }, [sourceImageData])
  const [settings, setSettings] = useState<ResizeSettings>({
    inputMode: 'pixels',
    width: sourceSize.width,
    height: sourceSize.height,
    keepAspectRatio: true,
    interpolationMethod: DEFAULT_RESIZE_METHOD,
  })
  const targetSize: ImageSize = useMemo((): ImageSize => {
    return getTargetSizeFromSettings(settings, sourceSize)
  }, [settings, sourceSize])
  const validation: ResizeValidationResult = useMemo((): ResizeValidationResult => {
    return validateResizeSettings(settings, sourceSize)
  }, [settings, sourceSize])
  const stats: ResizeStats = useMemo((): ResizeStats => {
    return calculateResizeStats(sourceSize, targetSize)
  }, [sourceSize, targetSize])
  const selectedAlgorithm: InterpolationAlgorithm =
    INTERPOLATION_ALGORITHMS.find(
      (algorithm: InterpolationAlgorithm): boolean => algorithm.id === settings.interpolationMethod,
    ) ?? INTERPOLATION_ALGORITHMS[0]

  function handleInputModeChange(event: ChangeEvent<HTMLSelectElement>): void {
    const inputMode = event.currentTarget.value === 'percent' ? 'percent' : 'pixels'

    setSettings({
      ...settings,
      inputMode,
      width: inputMode === 'percent' ? 100 : sourceSize.width,
      height: inputMode === 'percent' ? 100 : sourceSize.height,
    })
  }

  function handleWidthChange(value: number): void {
    if (!settings.keepAspectRatio) {
      setSettings({
        ...settings,
        width: value,
      })
      return
    }

    if (settings.inputMode === 'percent') {
      setSettings({
        ...settings,
        width: value,
        height: value,
      })
      return
    }

    const nextSize: ImageSize = calculateAspectRatioSize(sourceSize, 'width', value)
    setSettings({
      ...settings,
      width: nextSize.width,
      height: nextSize.height,
    })
  }

  function handleHeightChange(value: number): void {
    if (!settings.keepAspectRatio) {
      setSettings({
        ...settings,
        height: value,
      })
      return
    }

    if (settings.inputMode === 'percent') {
      setSettings({
        ...settings,
        width: value,
        height: value,
      })
      return
    }

    const nextSize: ImageSize = calculateAspectRatioSize(sourceSize, 'height', value)
    setSettings({
      ...settings,
      width: nextSize.width,
      height: nextSize.height,
    })
  }

  function handleApply(): void {
    if (!validation.ok) {
      return
    }

    onApply(resizeImage(sourceImageData, targetSize, settings.interpolationMethod))
  }

  return (
    <Modal open={open} title="Resize Image" onClose={onCancel}>
      <div className="resize-dialog">
        <section className="resize-stats" aria-label="Resize statistics">
          <StatItem label="Before" value={`${sourceSize.width} × ${sourceSize.height}`} />
          <StatItem label="After" value={`${targetSize.width} × ${targetSize.height}`} />
          <StatItem label="Pixels before" value={stats.beforePixels.toLocaleString('ru-RU')} />
          <StatItem label="Pixels after" value={stats.afterPixels.toLocaleString('ru-RU')} />
          <StatItem label="MP before" value={stats.beforeMegapixels.toString()} />
          <StatItem label="MP after" value={stats.afterMegapixels.toString()} />
        </section>

        <div className="resize-fields">
          <label className="resize-field">
            <span>Mode</span>
            <select value={settings.inputMode} onChange={handleInputModeChange}>
              <option value="pixels">Pixels</option>
              <option value="percent">Percent</option>
            </select>
          </label>

          <ResizeNumberField label="Width" value={settings.width} onChange={handleWidthChange} />
          <ResizeNumberField label="Height" value={settings.height} onChange={handleHeightChange} />

          <label className="resize-checkbox">
            <input
              checked={settings.keepAspectRatio}
              type="checkbox"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSettings({
                  ...settings,
                  keepAspectRatio: event.currentTarget.checked,
                })
              }}
            />
            Keep Aspect Ratio
          </label>

          <label className="resize-field">
            <span>Interpolation Method</span>
            <select
              title={selectedAlgorithm.description}
              value={settings.interpolationMethod}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const method: InterpolationMethod =
                  event.currentTarget.value === 'nearest-neighbor' ? 'nearest-neighbor' : 'bilinear'

                setSettings({
                  ...settings,
                  interpolationMethod: method,
                })
              }}
            >
              {INTERPOLATION_ALGORITHMS.map((algorithm: InterpolationAlgorithm) => (
                <option key={algorithm.id} value={algorithm.id}>
                  {algorithm.label}
                </option>
              ))}
            </select>
          </label>

          <p className="resize-tooltip">{selectedAlgorithm.description}</p>
          {validation.message === null ? null : <p className="resize-error">{validation.message}</p>}
        </div>

        <footer className="resize-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" disabled={!validation.ok} onClick={handleApply}>
            Apply
          </button>
        </footer>
      </div>
    </Modal>
  )
}

interface ResizeNumberFieldProps {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}

function ResizeNumberField({ label, value, onChange }: ResizeNumberFieldProps): JSX.Element {
  return (
    <label className="resize-field">
      <span>{label}</span>
      <input
        min={1}
        type="number"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(Number(event.currentTarget.value))
        }}
      />
    </label>
  )
}

interface StatItemProps {
  readonly label: string
  readonly value: string
}

function StatItem({ label, value }: StatItemProps): JSX.Element {
  return (
    <div className="resize-stat-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
