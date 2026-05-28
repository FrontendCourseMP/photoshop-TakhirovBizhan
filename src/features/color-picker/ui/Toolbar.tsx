import type { JSX } from 'react'

interface ToolbarProps {
  readonly isColorPickerActive: boolean
  readonly onColorPickerToggle: () => void
}

export function Toolbar({ isColorPickerActive, onColorPickerToggle }: ToolbarProps): JSX.Element {
  return (
    <section className="tool-panel" aria-label="Tools">
      <button
        className={isColorPickerActive ? 'tool-button tool-button--active' : 'tool-button'}
        type="button"
        aria-pressed={isColorPickerActive}
        onClick={onColorPickerToggle}
      >
        Пипетка
      </button>
    </section>
  )
}
