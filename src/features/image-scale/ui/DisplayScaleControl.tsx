import type { ChangeEvent, JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { getScaleOptions, getZoomedScalePercent } from '../lib/displayScale'
import { MAX_DISPLAY_SCALE_PERCENT, MIN_DISPLAY_SCALE_PERCENT } from '../model/displayScaleConstants'

interface DisplayScaleControlProps {
  readonly disabled: boolean
  readonly scalePercent: number
  readonly onScaleChange: (scalePercent: number) => void
  readonly onFitToViewport: () => void
}

export function DisplayScaleControl({
  disabled,
  scalePercent,
  onScaleChange,
  onFitToViewport,
}: DisplayScaleControlProps): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    // Control отдает наружу числовой percent, а clamp выполняется page-слоем
    // через общую scale utility, чтобы все источники scale проходили одну проверку.
    onScaleChange(Number(event.currentTarget.value))
  }

  return (
    <div className="zoom" role="group" aria-label="Zoom">
      <button
        className="btn btn--icon btn--attached"
        type="button"
        disabled={disabled || scalePercent <= MIN_DISPLAY_SCALE_PERCENT}
        title="Zoom out"
        aria-label="Zoom out"
        onClick={() => {
          onScaleChange(getZoomedScalePercent(scalePercent, -1))
        }}
      >
        <Icon name="zoomOut" />
      </button>
      <select
        className="select select--attached zoom__value"
        aria-label="Zoom level"
        disabled={disabled}
        value={scalePercent}
        onChange={handleChange}
      >
        {getScaleOptions(scalePercent).map((option: number) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
      </select>
      <button
        className="btn btn--icon btn--attached"
        type="button"
        disabled={disabled || scalePercent >= MAX_DISPLAY_SCALE_PERCENT}
        title="Zoom in"
        aria-label="Zoom in"
        onClick={() => {
          onScaleChange(getZoomedScalePercent(scalePercent, 1))
        }}
      >
        <Icon name="zoomIn" />
      </button>
      <button
        className="btn btn--icon btn--attached"
        type="button"
        disabled={disabled}
        title="Fit to workspace"
        aria-label="Fit to workspace"
        onClick={onFitToViewport}
      >
        <Icon name="fit" />
      </button>
      <button
        className="btn btn--attached zoom__actual"
        type="button"
        disabled={disabled || scalePercent === 100}
        title="Actual size, 100%"
        onClick={() => {
          onScaleChange(100)
        }}
      >
        1:1
      </button>
    </div>
  )
}
