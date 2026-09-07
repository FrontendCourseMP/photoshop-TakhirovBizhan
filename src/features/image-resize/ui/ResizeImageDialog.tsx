import { useMemo, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { Icon } from '../../../shared/ui/Icon'
import { Tooltip } from '../../../shared/ui/Tooltip'
import { OperationLoader } from '../../../shared/ui/OperationLoader/OperationLoader'
import type { ImageSize } from '../../../shared/types/imageSize'
import {
  calculateAspectRatioSize,
  calculateResizeStats,
  getDisplayDimensionValue,
  getTargetSizeFromSettings,
  parseDisplayDimensionValue,
  validateResizeSettings,
} from '../lib/resizeValidation'
import { resizeImageInWorker } from '../../image-processing-worker/workerClient'
import { DEFAULT_RESIZE_METHOD, INTERPOLATION_ALGORITHMS } from '../model/resizeConstants'
import type { InterpolationAlgorithm, InterpolationMethod, ResizeSettings, ResizeStats, ResizeValidationResult } from '../types'

interface ResizeImageDialogProps {
  readonly open: boolean
  readonly sourceImageData: ImageData
  readonly onApply: (imageData: ImageData) => void
  readonly onCancel: () => void
  readonly onProcessingChange?: (isPending: boolean) => void
}

export function ResizeImageDialog({
  open,
  sourceImageData,
  onApply,
  onCancel,
  onProcessingChange,
}: ResizeImageDialogProps): JSX.Element | null {
  const sourceSize: ImageSize = useMemo((): ImageSize => {
    // Размер source фиксируется из ImageData и используется как база для процентов,
    // aspect ratio и статистики, чтобы расчеты не зависели от временного UI-ввода.
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
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const targetSize: ImageSize = useMemo((): ImageSize => {
    // settings.width/height уже в пикселях независимо от inputMode, поэтому target
    // это просто округленный и защищенный от нуля settings.
    return getTargetSizeFromSettings(settings)
  }, [settings])
  const validation: ResizeValidationResult = useMemo((): ResizeValidationResult => {
    // Validation выполняется до тяжелого resize, чтобы некорректные размеры
    // не создавали большие массивы пикселей и не блокировали UI.
    return validateResizeSettings(settings)
  }, [settings])
  const stats: ResizeStats = useMemo((): ResizeStats => {
    // Статистика показывает пользователю масштаб изменения до применения операции.
    return calculateResizeStats(sourceSize, targetSize)
  }, [sourceSize, targetSize])
  const selectedAlgorithm: InterpolationAlgorithm =
    INTERPOLATION_ALGORITHMS.find(
      (algorithm: InterpolationAlgorithm): boolean => algorithm.id === settings.interpolationMethod,
    ) ?? INTERPOLATION_ALGORITHMS[0]
  const unitLabel: string = settings.inputMode === 'percent' ? '%' : 'px'

  function handleCancel(): void {
    if (isApplying) {
      return
    }

    onCancel()
  }

  function handleInputModeChange(event: ChangeEvent<HTMLSelectElement>): void {
    // width/height не трогаем: они уже хранятся в пикселях, режим влияет только на то,
    // что показывают поля ввода. Иначе переключение Pixels/Percent стирало бы введенный размер.
    const inputMode = event.currentTarget.value === 'percent' ? 'percent' : 'pixels'

    setSettings({
      ...settings,
      inputMode,
    })
  }

  function handleWidthChange(displayValue: number): void {
    // Поле могло показывать проценты - сначала переводим введенное число в пиксели,
    // потому что settings.width хранится только в пикселях.
    const pixelValue: number = parseDisplayDimensionValue(displayValue, 'width', settings.inputMode, sourceSize)

    if (!settings.keepAspectRatio) {
      // Без сохранения пропорций ширина и высота редактируются независимо.
      setSettings({
        ...settings,
        width: pixelValue,
      })
      return
    }

    // Связанный размер считается от исходного aspect ratio, а не от текущего target,
    // чтобы последовательные правки не накапливали ошибку округления.
    const nextSize: ImageSize = calculateAspectRatioSize(sourceSize, 'width', pixelValue)
    setSettings({
      ...settings,
      width: nextSize.width,
      height: nextSize.height,
    })
  }

  function handleHeightChange(displayValue: number): void {
    const pixelValue: number = parseDisplayDimensionValue(displayValue, 'height', settings.inputMode, sourceSize)

    if (!settings.keepAspectRatio) {
      // Если пользователь отключил aspect ratio, высота меняется без влияния на ширину.
      setSettings({
        ...settings,
        height: pixelValue,
      })
      return
    }

    // Пересчет ширины от высоты использует исходные размеры, а не текущий target,
    // чтобы результат был предсказуемым после нескольких изменений.
    const nextSize: ImageSize = calculateAspectRatioSize(sourceSize, 'height', pixelValue)
    setSettings({
      ...settings,
      width: nextSize.width,
      height: nextSize.height,
    })
  }

  async function handleApply(): Promise<void> {
    if (!validation.ok) {
      // Защита дублирует disabled-кнопку: функцию нельзя применить с невалидным state
      // даже если обработчик будет вызван напрямую.
      return
    }

    // Resize выполняется только при Apply, потому что операция создает новый ImageData
    // и может быть дорогой на больших изображениях.
    setIsApplying(true)
    onProcessingChange?.(true)

    try {
      onApply(await resizeImageInWorker(sourceImageData, targetSize, settings.interpolationMethod))
    } catch {
      // При сбое Worker dialog остается открытым, а исходное изображение не меняется.
    } finally {
      setIsApplying(false)
      onProcessingChange?.(false)
    }
  }

  return (
    <Modal open={open} title="Resize image" subtitle="Interpolated resampling of the whole image" onClose={handleCancel}>
      <div className="resize">
        <section className="compare" aria-label="Resize summary">
          <div className="compare__row compare__row--head">
            <span />
            <span>Before</span>
            <span>After</span>
          </div>
          <CompareRow
            label="Dimensions"
            before={`${sourceSize.width} × ${sourceSize.height}`}
            after={`${targetSize.width} × ${targetSize.height}`}
          />
          <CompareRow
            label="Pixels"
            before={stats.beforePixels.toLocaleString('en-US')}
            after={stats.afterPixels.toLocaleString('en-US')}
          />
          <CompareRow
            label="Megapixels"
            before={`${stats.beforeMegapixels} MP`}
            after={`${stats.afterMegapixels} MP`}
          />
        </section>

        <label className="field">
          <span className="field__label">Input mode</span>
          <select className="select" value={settings.inputMode} onChange={handleInputModeChange}>
            <option value="pixels">Pixels</option>
            <option value="percent">Percent of the original</option>
          </select>
        </label>

        <div className="size-fields">
          <ResizeNumberField
            label={`Width, ${unitLabel}`}
            value={getDisplayDimensionValue(settings.width, 'width', settings.inputMode, sourceSize)}
            onChange={handleWidthChange}
          />
          {/* Скоба между полями только показывает состояние связи: переключает ее checkbox ниже. */}
          <span
            className={
              settings.keepAspectRatio ? 'size-fields__link' : 'size-fields__link size-fields__link--off'
            }
            aria-hidden="true"
          >
            <Icon name="link" />
          </span>
          <ResizeNumberField
            label={`Height, ${unitLabel}`}
            value={getDisplayDimensionValue(settings.height, 'height', settings.inputMode, sourceSize)}
            onChange={handleHeightChange}
          />
        </div>

        <label className="checkbox">
          <input
            checked={settings.keepAspectRatio}
            type="checkbox"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              // Переключение меняет только связь размеров: текущие значения пересчитываются
              // при следующем изменении width или height.
              setSettings({
                ...settings,
                keepAspectRatio: event.currentTarget.checked,
              })
            }}
          />
          <span>Keep aspect ratio</span>
        </label>

        <p className="hint">
          {settings.keepAspectRatio
            ? 'The second dimension follows the one you edit, using the original proportions.'
            : 'Width and height change independently.'}
        </p>

        <div className="field">
          <div className="field__heading">
            <label className="field__label" htmlFor="resize-interpolation">
              Interpolation
            </label>
            <Tooltip label={`What ${selectedAlgorithm.label} interpolation does`}>
              <strong className="tooltip__title">{selectedAlgorithm.label}</strong>
              {selectedAlgorithm.description}
            </Tooltip>
          </div>
          <select
            className="select"
            id="resize-interpolation"
            value={settings.interpolationMethod}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              // Значение select проверяется вручную, чтобы в state попал только известный метод.
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
        </div>

        {validation.message === null ? null : (
          <p className="error-text" role="alert">
            {validation.message}
          </p>
        )}
        <OperationLoader active={isApplying} label="Resizing image…" />

        <footer className="dialog__footer dialog__footer--end">
          <div className="dialog__actions">
            <button className="btn" type="button" disabled={isApplying} onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={!validation.ok || isApplying}
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

interface ResizeNumberFieldProps {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}

function ResizeNumberField({ label, value, onChange }: ResizeNumberFieldProps): JSX.Element {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="input"
        min={1}
        type="number"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          // Number input может временно вернуть NaN при пустом поле; validation ниже
          // не даст применить некорректное значение.
          onChange(Number(event.currentTarget.value))
        }}
      />
    </label>
  )
}

interface CompareRowProps {
  readonly label: string
  readonly before: string
  readonly after: string
}

function CompareRow({ label, before, after }: CompareRowProps): JSX.Element {
  return (
    <div className="compare__row">
      <span className="compare__label">{label}</span>
      <span className="compare__value">{before}</span>
      <strong className="compare__value compare__value--after">{after}</strong>
    </div>
  )
}
