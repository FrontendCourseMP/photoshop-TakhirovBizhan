import type { ChangeEvent, JSX } from 'react'
import { FILTER_KERNEL_PRESETS } from '../model/kernels'
import type { KernelPreset, KernelPresetId } from '../types'

interface FilterPresetsSelectProps {
  readonly onPresetSelect: (preset: KernelPreset) => void
}

export function FilterPresetsSelect({ onPresetSelect }: FilterPresetsSelectProps): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    // Preset ищется по id из model; если DOM вернул неизвестное значение,
    // настройки фильтра не меняются.
    const preset: KernelPreset | undefined = FILTER_KERNEL_PRESETS.find(
      (item: KernelPreset): boolean => item.id === event.currentTarget.value,
    )

    if (preset !== undefined) {
      onPresetSelect(preset)
    }
  }

  return (
    <label className="filter-field">
      <span>Preset</span>
      <select defaultValue={'identity' satisfies KernelPresetId} onChange={handleChange}>
        {FILTER_KERNEL_PRESETS.map((preset: KernelPreset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </label>
  )
}
