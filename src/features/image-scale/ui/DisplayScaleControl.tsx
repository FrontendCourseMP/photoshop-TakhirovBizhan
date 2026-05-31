import type { ChangeEvent, JSX } from 'react'
import { DISPLAY_SCALE_OPTIONS } from '../model/displayScaleConstants'

interface DisplayScaleControlProps {
  readonly disabled: boolean
  readonly scalePercent: number
  readonly onScaleChange: (scalePercent: number) => void
}

export function DisplayScaleControl({
  disabled,
  scalePercent,
  onScaleChange,
}: DisplayScaleControlProps): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    onScaleChange(Number(event.currentTarget.value))
  }

  return (
    <label className="display-scale-control">
      <span>Scale</span>
      <select disabled={disabled} value={scalePercent} onChange={handleChange}>
        {DISPLAY_SCALE_OPTIONS.map((option: number) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
      </select>
    </label>
  )
}
