import type { JSX } from 'react'
import { isFilterOptionSelected, toggleFilterOption } from '../model/filterChannels'
import type { FilterChannel, FilterChannelOption } from '../types'

interface FilterChannelsProps {
  readonly options: readonly FilterChannelOption[]
  readonly selectedChannels: readonly FilterChannel[]
  readonly onChannelsChange: (channels: readonly FilterChannel[]) => void
}

export function FilterChannels({ options, selectedChannels, onChannelsChange }: FilterChannelsProps): JSX.Element {
  return (
    <fieldset className="field checkbox-group">
      <legend className="field__label">Channels</legend>
      <div className="checkbox-group__options">
        {options.map((option: FilterChannelOption) => (
          <label className="checkbox" key={option.id}>
            <input
              checked={isFilterOptionSelected(option, selectedChannels)}
              type="checkbox"
              onChange={() => {
                // Состояние самого checkbox не читается: вариант выбора может отвечать
                // сразу за несколько компонентов, поэтому набор каналов пересобирается целиком.
                onChannelsChange(toggleFilterOption(option, selectedChannels))
              }}
            />
            <span className={`channel-dot channel-dot--${option.id}`} aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
