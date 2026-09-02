import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import type { ImageMetadata } from '../../../entities/image/types'
import { Modal } from '../../../shared/ui/Modal'
import { Icon } from '../../../shared/ui/Icon'
import { HISTOGRAM_BIN_COUNT } from '../../histogram/lib/calculateHistogram'
import { HistogramCanvas } from '../../histogram/ui/HistogramCanvas'
import type { HistogramData, HistogramMode } from '../../histogram/types'
import { applyLevelsInWorker, calculateHistogramInWorker } from '../../image-processing-worker/workerClient'
import { useLevelsPreview } from '../hooks/useLevelsPreview'
import { getMidtoneLevel, levelToPercent } from '../lib/inputLevels'
import {
  BLACK_POINT_RANGE,
  DEFAULT_LEVELS_STATE,
  GAMMA_RANGE,
  LEVELS_CHANNELS,
  WHITE_POINT_RANGE,
} from '../model/defaultLevels'
import { resolveLevelsChannels } from '../model/levelsChannels'
import type { LevelsChannel, LevelsChannelOption, LevelsSettings, LevelsState } from '../types'
import { InputLevelsTrack } from './InputLevelsTrack'

interface LevelsDialogProps {
  readonly open: boolean
  readonly sourceImageData: ImageData
  readonly metadata: ImageMetadata
  readonly onPreviewChange: (preview: ImageData | null) => void
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
  readonly onProcessingChange?: (isPending: boolean) => void
}

interface HistogramState {
  readonly sourceImageData: ImageData | null
  readonly channel: LevelsChannel | null
  readonly histogram: HistogramData
}

// Пустая гистограмма показывается, пока Worker не вернул подсчет для текущего канала.
// Массив только читается, поэтому его можно держать общим для всех render.
const EMPTY_HISTOGRAM: HistogramData = new Uint32Array(HISTOGRAM_BIN_COUNT)

export function LevelsDialog({
  open,
  sourceImageData,
  metadata,
  onPreviewChange,
  onApply,
  onCancel,
  onProcessingChange,
}: LevelsDialogProps): JSX.Element | null {
  // Dialog хранит только UI-состояние Levels: выбранный канал, режим histogram,
  // включенность preview и настройки каждого канала. Обработка пикселей остается в lib и Worker.
  const [selectedChannel, setSelectedChannel] = useState<LevelsChannel>('master')
  const [histogramMode, setHistogramMode] = useState<HistogramMode>('linear')
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(true)
  const [levelsState, setLevelsState] = useState<LevelsState>(DEFAULT_LEVELS_STATE)
  const [histogramState, setHistogramState] = useState<HistogramState>({
    sourceImageData: null,
    channel: null,
    histogram: EMPTY_HISTOGRAM,
  })
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const histogramTaskIdRef = useRef<number>(0)
  const channelOptions: readonly LevelsChannelOption[] = useMemo(
    (): readonly LevelsChannelOption[] => resolveLevelsChannels(metadata),
    [metadata],
  )
  // В формате может не быть выбранного канала, поэтому активным считается тот, который реально
  // есть в списке: иначе инструмент правил бы отсутствующий alpha или green.
  const activeChannel: LevelsChannel = channelOptions.some(
    (option: LevelsChannelOption): boolean => option.channel === selectedChannel,
  )
    ? selectedChannel
    : channelOptions[0].channel
  const selectedSettings: LevelsSettings = levelsState[activeChannel]
  const histogram: HistogramData =
    histogramState.sourceImageData === sourceImageData && histogramState.channel === activeChannel
      ? histogramState.histogram
      : EMPTY_HISTOGRAM

  useEffect((): (() => void) => {
    const taskId: number = histogramTaskIdRef.current + 1
    histogramTaskIdRef.current = taskId

    // Гистограмма строится по исходному изображению, а не по результату коррекции: маркеры
    // входных уровней должны показывать, какую часть исходного распределения они отсекают.
    // Поэтому пересчет нужен только при смене файла или канала, а не на каждое движение маркера.
    void calculateHistogramInWorker(sourceImageData, activeChannel)
      .then((nextHistogram: HistogramData): void => {
        if (histogramTaskIdRef.current === taskId) {
          setHistogramState({ sourceImageData, channel: activeChannel, histogram: nextHistogram })
        }
      })
      .catch((): void => {
        if (histogramTaskIdRef.current === taskId) {
          setHistogramState({ sourceImageData, channel: activeChannel, histogram: EMPTY_HISTOGRAM })
        }
      })

    return (): void => {
      histogramTaskIdRef.current += 1
    }
  }, [activeChannel, sourceImageData])

  useLevelsPreview({
    sourceImageData,
    levelsState,
    previewEnabled,
    onPreviewChange,
  })

  function updateSelectedSettings(nextSettings: LevelsSettings): void {
    // Маркер, упершийся в соседний, отдает одно и то же значение на каждом pointermove.
    // Без этой проверки каждый такой шаг создавал бы новый state и лишний пересчет preview.
    if (
      nextSettings.blackPoint === selectedSettings.blackPoint &&
      nextSettings.whitePoint === selectedSettings.whitePoint &&
      nextSettings.gamma === selectedSettings.gamma
    ) {
      return
    }

    // Настройки хранятся отдельно для каждого канала, поэтому переключение Master/R/G/B/A
    // не сбрасывает уже выставленные black/white/gamma значения.
    setLevelsState((currentState: LevelsState): LevelsState => ({
      ...currentState,
      [activeChannel]: nextSettings,
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
    <Modal
      open={open}
      size="lg"
      title="Levels"
      subtitle="Remap input levels per channel with a live canvas preview"
      onClose={handleCancel}
    >
      <div className="levels">
        <div className="form-row">
          <label className="field">
            <span className="field__label">Channel</span>
            <select
              className="select"
              value={activeChannel}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const nextChannel: LevelsChannel | null = parseLevelsChannel(event.currentTarget.value)

                if (nextChannel !== null) {
                  setSelectedChannel(nextChannel)
                }
              }}
            >
              {channelOptions.map((option: LevelsChannelOption) => (
                <option key={option.channel} value={option.channel}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="field segmented">
            <legend className="field__label">Histogram scale</legend>
            <div className="segmented__options">
              <label className="segmented__option">
                <input
                  checked={histogramMode === 'linear'}
                  name="histogram-mode"
                  type="radio"
                  onChange={() => {
                    setHistogramMode('linear')
                  }}
                />
                <span>Linear</span>
              </label>
              <label className="segmented__option">
                <input
                  checked={histogramMode === 'log'}
                  name="histogram-mode"
                  type="radio"
                  onChange={() => {
                    setHistogramMode('log')
                  }}
                />
                <span>Logarithmic</span>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="levels__graph">
          <div className="levels__histogram">
            <HistogramCanvas histogram={histogram} mode={histogramMode} />
            {/* Затемнение отмечает тона, которые уйдут в чистый черный и чистый белый,
                а вертикальная линия показывает положение полутонового маркера. */}
            <span
              className="levels-clip levels-clip--shadows"
              style={{ width: `${levelToPercent(selectedSettings.blackPoint)}%` }}
              aria-hidden="true"
            />
            <span
              className="levels-clip levels-clip--highlights"
              style={{ width: `${100 - levelToPercent(selectedSettings.whitePoint)}%` }}
              aria-hidden="true"
            />
            <span
              className="levels-midtone-line"
              style={{ left: `${levelToPercent(getMidtoneLevel(selectedSettings))}%` }}
              aria-hidden="true"
            />
          </div>

          <InputLevelsTrack settings={selectedSettings} onChange={updateSelectedSettings} />
        </div>

        <div className="levels__inputs" role="group" aria-label="Input levels">
          <LevelsNumberField
            label="Black"
            max={selectedSettings.whitePoint - 1}
            min={BLACK_POINT_RANGE.min}
            step={BLACK_POINT_RANGE.step}
            value={selectedSettings.blackPoint}
            onChange={handleBlackPointChange}
          />
          <LevelsNumberField
            label="Gamma"
            max={GAMMA_RANGE.max}
            min={GAMMA_RANGE.min}
            step={GAMMA_RANGE.step}
            value={selectedSettings.gamma}
            onChange={handleGammaChange}
          />
          <LevelsNumberField
            label="White"
            max={WHITE_POINT_RANGE.max}
            min={selectedSettings.blackPoint + 1}
            step={WHITE_POINT_RANGE.step}
            value={selectedSettings.whitePoint}
            onChange={handleWhitePointChange}
          />
        </div>

        <footer className="dialog__footer">
          <label className="checkbox">
            <input
              checked={previewEnabled}
              type="checkbox"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setPreviewEnabled(event.currentTarget.checked)
              }}
            />
            <span>Preview on canvas</span>
          </label>

          <div className="dialog__actions">
            <button className="btn btn--ghost" type="button" disabled={isApplying} onClick={handleReset}>
              <Icon name="reset" />
              <span>Reset</span>
            </button>
            <button className="btn" type="button" disabled={isApplying} onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={isApplying}
              onClick={() => {
                void handleApply()
              }}
            >
              {isApplying ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  )
}

interface LevelsNumberFieldProps {
  readonly label: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly value: number
  readonly onChange: (value: number) => void
}

function LevelsNumberField({ label, min, max, step, value, onChange }: LevelsNumberFieldProps): JSX.Element {
  // Числовое поле дублирует маркер оси: через него значение задается точно
  // и остается доступным без перетаскивания.
  return (
    <label className="levels-field">
      <span className="levels-field__label">{label}</span>
      <input
        className="input levels-field__input"
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(Number(event.currentTarget.value))
        }}
      />
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
