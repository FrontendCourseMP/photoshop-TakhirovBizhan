import type { ChangeEvent, JSX } from 'react'
import type { EdgeHandlingStrategy } from '../types'

interface EdgeHandlingSelectProps {
  readonly value: EdgeHandlingStrategy
  readonly onChange: (value: EdgeHandlingStrategy) => void
}

export function EdgeHandlingSelect({ value, onChange }: EdgeHandlingSelectProps): JSX.Element {
  return (
    <label className="field">
      <span className="field__label">Edge handling</span>
      <select
        className="select"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          onChange(parseEdgeHandlingStrategy(event.currentTarget.value))
        }}
      >
        <option value="copy">Repeat the nearest pixel</option>
        <option value="black">Pad with black</option>
        <option value="white">Pad with white</option>
      </select>
    </label>
  )
}

function parseEdgeHandlingStrategy(value: string): EdgeHandlingStrategy {
  // Select возвращает string, поэтому значение проверяется по допустимым стратегиям.
  // Fallback copy безопаснее для границ: он не добавляет искусственный черный/белый контур.
  if (value === 'black' || value === 'white' || value === 'copy') {
    return value
  }

  return 'copy'
}
