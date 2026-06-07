import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { createRafPreviewScheduler, type RafPreviewScheduler } from '../../../shared/performance/rafScheduler'
import { HistogramCanvas } from '../../histogram/ui/HistogramCanvas'
import type { HistogramData, HistogramMode } from '../../histogram/types'
import { applyLevelsInWorker, applyLevelsPreviewInWorker } from '../../image-processing-worker/workerClient'
import {
  BLACK_POINT_RANGE,
  DEFAULT_LEVELS_STATE,
  GAMMA_RANGE,
  LEVELS_CHANNELS,
  WHITE_POINT_RANGE,
} from '../model/defaultLevels'
import type { LevelsChannel, LevelsSettings, LevelsState } from '../types'

interface LevelsDialogProps {
  readonly sourceImageData: ImageData
  readonly onPreviewChange: (preview: ImageData | null) => void
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
  readonly onProcessingChange?: (isPending: boolean) => void
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
  onProcessingChange,
}: LevelsDialogProps): JSX.Element {
  // Dialog хранит только UI-состояние Levels: выбранный канал, режим histogram,
  // включенность preview и настройки каждого канала. Обработка пикселей остается в lib.
  const [selectedChannel, setSelectedChannel] = useState<LevelsChannel>('master')
  const [histogramMode, setHistogramMode] = useState<HistogramMode>('linear')
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(true)
  const [levelsState, setLevelsState] = useState<LevelsState>(DEFAULT_LEVELS_STATE)
  const [histogramState, setHistogramState] = useState<{
    readonly sourceImageData: ImageData | null
    readonly selectedChannel: LevelsChannel | null
    readonly histogram: HistogramData
  }>({
    sourceImageData: null,
    selectedChannel: null,
    histogram: new Uint32Array(256),
  })
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const previewTaskIdRef = useRef<number>(0)
  const schedulerRef = useRef<RafPreviewScheduler | null>(null)
  const selectedSettings: LevelsSettings = levelsState[selectedChannel]
  const histogram: HistogramData =
    histogramState.sourceImageData === sourceImageData && histogramState.selectedChannel === selectedChannel
      ? histogramState.histogram
      : new Uint32Array(256)
  if (schedulerRef.current === null) {
    schedulerRef.current = createRafPreviewScheduler()
  }

  useEffect((): (() => void) => {
    const scheduler: RafPreviewScheduler = schedulerRef.current ?? createRafPreviewScheduler()
    schedulerRef.current = scheduler
    const taskId: number = previewTaskIdRef.current + 1
    previewTaskIdRef.current = taskId

    if (!previewEnabled) {
      onPreviewChange(null)
    }

    scheduler.schedulePreviewUpdate((): void => {
      // Preview canvas и histogram считаются одной Worker-задачей, чтобы оба результата
      // соответствовали одним и тем же настройкам Levels и не расходились из-за гонок.
      void applyLevelsPreviewInWorker(sourceImageData, levelsState, selectedChannel)
        .then((result): void => {
          if (previewTaskIdRef.current === taskId) {
            setHistogramState({
              sourceImageData,
              selectedChannel,
              histogram: result.histogram,
            })

            if (previewEnabled) {
              onPreviewChange(result.imageData)
            }
          }
        })
        .catch((): void => {
          if (previewTaskIdRef.current === taskId) {
            setHistogramState({
              sourceImageData,
              selectedChannel,
              histogram: new Uint32Array(256),
            })
            onPreviewChange(null)
          }
        })
    })

    return (): void => {
      previewTaskIdRef.current += 1
      scheduler.cancelPreviewUpdate()
    }
  }, [levelsState, onPreviewChange, previewEnabled, selectedChannel, sourceImageData])

  function updateSelectedSettings(nextSettings: LevelsSettings): void {
    // Настройки хранятся отдельно для каждого канала, поэтому переключение Master/R/G/B/A
    // не сбрасывает уже выставленные black/white/gamma значения.
    setLevelsState((currentState: LevelsState): LevelsState => ({
      ...currentState,
      [selectedChannel]: nextSettings,
    }))
  }

  function handleBlackPointChange(value: number): void {
    // Black point не может догнать white point: LUT требует ненулевой диапазон входных уровней.
    const blackPoint: number = clampInteger(value, BLACK_POINT_RANGE.min, selectedSettings.whitePoint - 1)
    updateSelectedSettings({
      ...selectedSettings,
      blackPoint,
    })
  }

  function handleWhitePointChange(value: number): void {
    // White point ограничивается справа 255 и слева текущим black point + 1,
    // чтобы избежать деления на ноль при нормализации пикселя.
    const whitePoint: number = clampInteger(value, selectedSettings.blackPoint + 1, WHITE_POINT_RANGE.max)
    updateSelectedSettings({
      ...selectedSettings,
      whitePoint,
    })
  }

  function handleGammaChange(value: number): void {
    // Gamma ограничивается рабочим диапазоном Levels: слишком малые или NaN значения
    // приводили бы к неконтролируемому изменению средних тонов.
    const gamma: number = clampNumber(value, GAMMA_RANGE.min, GAMMA_RANGE.max)
    updateSelectedSettings({
      ...selectedSettings,
      gamma,
    })
  }

  function handleReset(): void {
    // Reset возвращает все каналы к линейному отображению, но dialog остается открытым
    // для дальнейшего сравнения и настройки.
    setLevelsState(DEFAULT_LEVELS_STATE)
  }

  function handleCancel(): void {
    if (isApplying) {
      return
    }

    // Cancel закрывает dialog и явно сбрасывает preview, чтобы canvas вернулся к snapshot.
    onPreviewChange(null)
    onCancel()
  }

  async function handleApply(): Promise<void> {
    // Apply пересчитывает итоговое изображение один раз и передает его page-слою
    // как новое постоянное состояние редактора.
    onPreviewChange(null)
    setIsApplying(true)
    onProcessingChange?.(true)

    try {
      onApply(await applyLevelsInWorker(sourceImageData, levelsState))
    } catch {
      // При ошибке Worker не закрываем dialog и не применяем частичный результат.
      // Canvas остается в исходном состоянии, потому что preview уже сброшен.
      onPreviewChange(null)
    } finally {
      setIsApplying(false)
      onProcessingChange?.(false)
    }
  }

  return (
    <section className="levels-dialog" aria-label="Levels">
      <div className="levels-dialog__content">
        <header className="levels-dialog__header">
          <h2>Levels</h2>
          <span>Input levels with canvas preview</span>
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
            Preview on canvas
          </label>

          <div className="levels-dialog__actions">
            <button type="button" disabled={isApplying} onClick={handleReset}>
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
          </div>
        </footer>
      </div>
    </section>
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
    // Range и number input используют один обработчик, чтобы оба контрола всегда
    // работали с одинаковыми ограничениями выбранного параметра.
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
  // Точки black/white должны оставаться целыми индексами LUT в диапазоне 0..255.
  return Math.round(clampNumber(value, min, max))
}

function clampNumber(value: number, min: number, max: number): number {
  // Некорректный ввод из number input безопасно сводится к min,
  // чтобы в state не попадали NaN/Infinity и не ломали preview.
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

function parseLevelsChannel(value: string): LevelsChannel | null {
  // Значение select приходит как string, поэтому перед записью в state
  // проверяем его по whitelist каналов Levels.
  for (const channel of LEVELS_CHANNELS) {
    if (channel === value) {
      return channel
    }
  }

  return null
}
