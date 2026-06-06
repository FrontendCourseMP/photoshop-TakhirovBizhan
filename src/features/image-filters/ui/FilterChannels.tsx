import type { ChangeEvent, JSX } from 'react'
import type { FilterChannel } from '../types'

interface FilterChannelsProps {
  readonly selectedChannels: readonly FilterChannel[]
  readonly onChannelsChange: (channels: readonly FilterChannel[]) => void
}

const FILTER_CHANNELS: readonly FilterChannel[] = ['red', 'green', 'blue', 'alpha']

const channelLabels: Readonly<Record<FilterChannel, string>> = {
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  alpha: 'Alpha',
}

export function FilterChannels({ selectedChannels, onChannelsChange }: FilterChannelsProps): JSX.Element {
  function handleChannelChange(channel: FilterChannel, checked: boolean): void {
    // Каналы фильтра хранятся как immutable список, чтобы React корректно увидел
    // изменение settings и перезапустил preview.
    if (checked) {
      onChannelsChange([...selectedChannels, channel])
      return
    }

    onChannelsChange(selectedChannels.filter((selectedChannel: FilterChannel): boolean => selectedChannel !== channel))
  }

  return (
    <fieldset className="filter-channel-group">
      <legend>Channels</legend>
      {FILTER_CHANNELS.map((channel: FilterChannel) => (
        <label key={channel}>
          <input
            checked={selectedChannels.includes(channel)}
            type="checkbox"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              handleChannelChange(channel, event.currentTarget.checked)
            }}
          />
          {channelLabels[channel]}
        </label>
      ))}
    </fieldset>
  )
}
