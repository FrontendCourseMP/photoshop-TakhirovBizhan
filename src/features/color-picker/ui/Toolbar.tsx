import type { JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'

interface ToolbarProps {
  readonly isColorPickerActive: boolean
  readonly canPickColor: boolean
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
  canPickColor,
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
    <div className="toolgroup" role="group" aria-label="Tools">
      <button
        className={isColorPickerActive ? 'btn btn--active' : 'btn'}
        type="button"
        disabled={!canPickColor}
        aria-pressed={isColorPickerActive}
        title="Sample a pixel color"
        onClick={onColorPickerToggle}
      >
        <Icon name="pipette" />
        <span>Eyedropper</span>
      </button>
      <button className="btn" type="button" disabled={!canOpenLevels} title="Adjust input levels" onClick={onLevelsOpen}>
        <Icon name="levels" />
        <span>Levels</span>
      </button>
      <button className="btn" type="button" disabled={!canOpenResize} title="Resize the image" onClick={onResizeOpen}>
        <Icon name="resize" />
        <span>Resize</span>
      </button>
      <button className="btn" type="button" disabled={!canOpenFilters} title="Apply a convolution filter" onClick={onFiltersOpen}>
        <Icon name="filters" />
        <span>Filters</span>
      </button>
    </div>
  )
}
