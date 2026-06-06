import type { JSX } from 'react'

interface ToolbarProps {
  readonly isColorPickerActive: boolean
  readonly canOpenLevels: boolean
  readonly canOpenResize: boolean
  readonly canOpenFilters: boolean
  readonly onColorPickerToggle: () => void
  readonly onLevelsOpen: () => void
  readonly onResizeOpen: () => void
  readonly onFiltersOpen: () => void
}

export function Toolbar({
  isColorPickerActive,
  canOpenLevels,
  canOpenResize,
  canOpenFilters,
  onColorPickerToggle,
  onLevelsOpen,
  onResizeOpen,
  onFiltersOpen,
}: ToolbarProps): JSX.Element {
  // Toolbar только вызывает callbacks page-слоя. Так инструменты остаются независимыми,
  // а правила открытия dialog и наличие изображения контролируются выше.
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
      <button className="tool-button" type="button" disabled={!canOpenFilters} onClick={onFiltersOpen}>
        Filters
      </button>
    </section>
  )
}
