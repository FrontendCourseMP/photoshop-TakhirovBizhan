import type { ChangeEvent, JSX } from 'react'
import type { EdgeHandlingStrategy } from '../types'

interface EdgeHandlingSelectProps {
  readonly value: EdgeHandlingStrategy
  readonly onChange: (value: EdgeHandlingStrategy) => void
}

export function EdgeHandlingSelect({ value, onChange }: EdgeHandlingSelectProps): JSX.Element {
  return (
    <label className="filter-field">
      <span>Edges</span>
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          onChange(parseEdgeHandlingStrategy(event.currentTarget.value))
        }}
      >
        <option value="copy">Copy nearest pixel</option>
        <option value="black">Black fill</option>
        <option value="white">White fill</option>
      </select>
    </label>
  )
}

function parseEdgeHandlingStrategy(value: string): EdgeHandlingStrategy {
  if (value === 'black' || value === 'white' || value === 'copy') {
    return value
  }

  return 'copy'
}
