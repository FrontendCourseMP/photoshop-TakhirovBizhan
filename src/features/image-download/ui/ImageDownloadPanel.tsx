import type { ChangeEvent, JSX } from 'react'
import type { ImageFileFormat } from '../../../entities/image/types'
import { Icon } from '../../../shared/ui/Icon'

interface ImageDownloadPanelProps {
  readonly format: ImageFileFormat
  readonly disabled: boolean
  readonly isExporting: boolean
  readonly onFormatChange: (format: ImageFileFormat) => void
  readonly onExport: () => void
}

const EXPORT_FORMATS: readonly ImageFileFormat[] = ['png', 'jpeg', 'gb7']

export function ImageDownloadPanel({
  format,
  disabled,
  isExporting,
  onFormatChange,
  onExport,
}: ImageDownloadPanelProps): JSX.Element {
  function handleFormatChange(event: ChangeEvent<HTMLSelectElement>): void {
    // Значение select проверяется по whitelist, чтобы в state не попал неизвестный формат.
    const nextFormat: ImageFileFormat | undefined = EXPORT_FORMATS.find(
      (candidate: ImageFileFormat): boolean => candidate === event.currentTarget.value,
    )

    if (nextFormat !== undefined) {
      onFormatChange(nextFormat)
    }
  }

  return (
    <div className="input-group">
      <select
        className="select select--attached"
        aria-label="Export format"
        disabled={disabled || isExporting}
        value={format}
        onChange={handleFormatChange}
      >
        {EXPORT_FORMATS.map((exportFormat: ImageFileFormat) => (
          <option key={exportFormat} value={exportFormat}>
            {exportFormat.toUpperCase()}
          </option>
        ))}
      </select>
      <button
        className="btn btn--attached"
        type="button"
        disabled={disabled || isExporting}
        title="Save image"
        onClick={onExport}
      >
        <Icon name="save" />
        <span>{isExporting ? 'Saving…' : 'Save'}</span>
      </button>
    </div>
  )
}
