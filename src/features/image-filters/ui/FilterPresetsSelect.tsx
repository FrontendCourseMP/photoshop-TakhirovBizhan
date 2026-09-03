import type { ChangeEvent, JSX } from 'react'
import { FILTER_KERNEL_PRESETS, findMatchingPreset } from '../model/kernels'
import type { FilterSettings, KernelPreset } from '../types'

interface FilterPresetsSelectProps {
  readonly settings: FilterSettings
  readonly onPresetSelect: (preset: KernelPreset) => void
}

// Значение для состояния, в котором матрица отредактирована вручную и ни одному preset не равна.
const CUSTOM_PRESET_VALUE = 'custom'

export function FilterPresetsSelect({ settings, onPresetSelect }: FilterPresetsSelectProps): JSX.Element {
  const matchingPreset: KernelPreset | null = findMatchingPreset(settings)

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
    <label className="field">
      <span className="field__label">Preset</span>
      <select
        className="select"
        value={matchingPreset === null ? CUSTOM_PRESET_VALUE : matchingPreset.id}
        onChange={handleChange}
      >
        {/* Вариант Custom появляется только на время ручной правки: он показывает,
            что в сетке уже не преднастроенное ядро, и исчезает при возврате к preset. */}
        {matchingPreset === null ? <option value={CUSTOM_PRESET_VALUE}>Custom</option> : null}
        {FILTER_KERNEL_PRESETS.map((preset: KernelPreset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </label>
  )
}
