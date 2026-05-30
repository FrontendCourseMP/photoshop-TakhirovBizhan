import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { calculateHistogram } from '../../histogram/lib/calculateHistogram'
import { HistogramCanvas } from '../../histogram/ui/HistogramCanvas'
import type { HistogramData, HistogramMode } from '../../histogram/types'
import { applyLevels } from '../lib/applyLevels'
import {
  BLACK_POINT_RANGE,
  DEFAULT_LEVELS_STATE,
  GAMMA_RANGE,
  LEVELS_CHANNELS,
  WHITE_POINT_RANGE,
} from '../model/defaultLevels'
import { useLevelsPreview } from '../hooks/useLevelsPreview'
import type { LevelsChannel, LevelsSettings, LevelsState } from '../types'

interface LevelsDialogProps {
  readonly sourceImageData: ImageData
  readonly onPreviewChange: (preview: ImageData | null) => void
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
}

const channelLabels: Readonly<Record<LevelsChannel, string>> = {
  master: 'Master',
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  alpha: 'Alpha',
}

export function LevelsDialog({
  sourceImageData,
  onPreviewChange,
  onApply,
  onCancel,
}: LevelsDialogProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<LevelsChannel>('master')
  const [histogramMode, setHistogramMode] = useState<HistogramMode>('linear')
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(true)
  const [levelsState, setLevelsState] = useState<LevelsState>(DEFAULT_LEVELS_STATE)
  const selectedSettings: LevelsSettings = levelsState[selectedChannel]
  const histogram: HistogramData = useMemo((): HistogramData => {
    return calculateHistogram(sourceImageData, selectedChannel)
  }, [selectedChannel, sourceImageData])

  useLevelsPreview({
    sourceImageData,
    levelsState,
    previewEnabled,
    onPreviewChange,
  })

  useEffect((): void => {
    const dialog: HTMLDialogElement | null = dialogRef.current

    if (dialog !== null && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function updateSelectedSettings(nextSettings: LevelsSettings): void {
    setLevelsState((currentState: LevelsState): LevelsState => ({
      ...currentState,
      [selectedChannel]: nextSettings,
    }))
  }

  function handleBlackPointChange(value: number): void {
    const blackPoint: number = clampInteger(value, BLACK_POINT_RANGE.min, selectedSettings.whitePoint - 1)
    updateSelectedSettings({
      ...selectedSettings,
      blackPoint,
    })
  }

  function handleWhitePointChange(value: number): void {
    const whitePoint: number = clampInteger(value, selectedSettings.blackPoint + 1, WHITE_POINT_RANGE.max)
    updateSelectedSettings({
      ...selectedSettings,
      whitePoint,
    })
  }

  function handleGammaChange(value: number): void {
    const gamma: number = clampNumber(value, GAMMA_RANGE.min, GAMMA_RANGE.max)
    updateSelectedSettings({
      ...selectedSettings,
      gamma,
    })
  }

  function handleReset(): void {
    setLevelsState(DEFAULT_LEVELS_STATE)
  }

  function handleCancel(): void {
    onPreviewChange(null)
    onCancel()
  }

  function handleApply(): void {
    onPreviewChange(null)
    onApply(applyLevels(sourceImageData, levelsState))
  }

  return (
    <dialog className="levels-dialog" ref={dialogRef} onCancel={handleCancel}>
      <form className="levels-dialog__content" method="dialog">
        <header className="levels-dialog__header">
          <h2>Levels</h2>
          <span>Input levels with LUT preview</span>
        </header>

        <div className="levels-dialog__row">
          <label className="levels-field">
            <span>Channel</span>
            <select
              value={selectedChannel}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const nextChannel: LevelsChannel | null = parseLevelsChannel(event.currentTarget.value)

                if (nextChannel !== null) {
                  setSelectedChannel(nextChannel)
                }
              }}
            >
              {LEVELS_CHANNELS.map((channel: LevelsChannel) => (
                <option key={channel} value={channel}>
                  {channelLabels[channel]}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="levels-mode-switch">
            <legend>Histogram</legend>
            <label>
              <input
                checked={histogramMode === 'linear'}
                name="histogram-mode"
                type="radio"
                onChange={() => {
                  setHistogramMode('linear')
                }}
              />
              Linear
            </label>
            <label>
              <input
                checked={histogramMode === 'log'}
                name="histogram-mode"
                type="radio"
                onChange={() => {
                  setHistogramMode('log')
                }}
              />
              Log
            </label>
          </fieldset>
        </div>

        <div className="levels-histogram">
          <HistogramCanvas histogram={histogram} mode={histogramMode} />
        </div>

        <div className="levels-controls">
          <LevelsControl
            label="Black"
            max={selectedSettings.whitePoint - 1}
            min={BLACK_POINT_RANGE.min}
            step={BLACK_POINT_RANGE.step}
            value={selectedSettings.blackPoint}
            onChange={handleBlackPointChange}
          />
          <LevelsControl
            label="Gamma"
            max={GAMMA_RANGE.max}
            min={GAMMA_RANGE.min}
            step={GAMMA_RANGE.step}
            value={selectedSettings.gamma}
            onChange={handleGammaChange}
          />
          <LevelsControl
            label="White"
            max={WHITE_POINT_RANGE.max}
            min={selectedSettings.blackPoint + 1}
            step={WHITE_POINT_RANGE.step}
            value={selectedSettings.whitePoint}
            onChange={handleWhitePointChange}
          />
        </div>

        <footer className="levels-dialog__footer">
          <label className="levels-preview-toggle">
            <input
              checked={previewEnabled}
              type="checkbox"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setPreviewEnabled(event.currentTarget.checked)
              }}
            />
            Preview
          </label>

          <div className="levels-dialog__actions">
            <button type="button" onClick={handleReset}>
              Reset
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" onClick={handleApply}>
              Apply
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}

interface LevelsControlProps {
  readonly label: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly value: number
  readonly onChange: (value: number) => void
}

function LevelsControl({ label, min, max, step, value, onChange }: LevelsControlProps): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(Number(event.currentTarget.value))
  }

  return (
    <label className="levels-control">
      <span>{label}</span>
      <input max={max} min={min} step={step} type="range" value={value} onChange={handleChange} />
      <input max={max} min={min} step={step} type="number" value={value} onChange={handleChange} />
    </label>
  )
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.round(clampNumber(value, min, max))
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

function parseLevelsChannel(value: string): LevelsChannel | null {
  for (const channel of LEVELS_CHANNELS) {
    if (channel === value) {
      return channel
    }
  }

  return null
}
