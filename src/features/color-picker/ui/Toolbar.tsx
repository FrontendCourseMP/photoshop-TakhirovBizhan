import type { JSX } from 'react'

interface ToolbarProps {
  readonly isColorPickerActive: boolean
  readonly canOpenLevels: boolean
  readonly canOpenResize: boolean
  readonly onColorPickerToggle: () => void
  readonly onLevelsOpen: () => void
  readonly onResizeOpen: () => void
}

export function Toolbar({
  isColorPickerActive,
  canOpenLevels,
  canOpenResize,
  onColorPickerToggle,
  onLevelsOpen,
  onResizeOpen,
}: ToolbarProps): JSX.Element {
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
      <button className="tool-button" type="button" disabled={!canOpenLevels} onClick={onLevelsOpen}>
        Levels
      </button>
      <button className="tool-button" type="button" disabled={!canOpenResize} onClick={onResizeOpen}>
        Resize
      </button>
    </section>
  )
}
