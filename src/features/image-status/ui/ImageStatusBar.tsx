import type { JSX } from 'react'
import type { ImageMetadata } from '../../../entities/image/types'

interface ImageStatusBarProps {
  readonly metadata: ImageMetadata | null
  readonly displayScalePercent: number
}

const EMPTY_VALUE = '—'

export function ImageStatusBar({ metadata, displayScalePercent }: ImageStatusBarProps): JSX.Element {
  // Status bar показывает исходные metadata текущего изображения и display scale.
  // Эти значения не зависят от временных preview, пока пользователь не нажмет Apply.
  return (
    <footer className="statusbar" aria-label="Image status">
      <span className="statusbar__file" title={metadata?.fileName}>
        {metadata === null ? 'No image open' : metadata.fileName}
      </span>
      <div className="statusbar__items">
        <StatusItem
          label="Size"
          value={metadata === null ? EMPTY_VALUE : `${metadata.width} × ${metadata.height} px`}
        />
        <StatusItem
          label="Megapixels"
          value={metadata === null ? EMPTY_VALUE : `${roundMegapixels(metadata.width * metadata.height)} MP`}
        />
        <StatusItem label="Depth" value={metadata === null ? EMPTY_VALUE : `${metadata.colorDepth} bit`} />
        <StatusItem label="Format" value={metadata === null ? EMPTY_VALUE : metadata.format.toUpperCase()} />
        <StatusItem label="File" value={metadata === null ? EMPTY_VALUE : formatFileSize(metadata.fileSizeBytes)} />
        <StatusItem label="Zoom" value={metadata === null ? EMPTY_VALUE : `${displayScalePercent}%`} />
      </div>
    </footer>
  )
}

function roundMegapixels(pixels: number): number {
  // Округление до двух знаков делает строку стабильной и достаточно точной для status bar.
  return Math.round((pixels / 1_000_000) * 100) / 100
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface StatusItemProps {
  readonly label: string
  readonly value: string
}

function StatusItem({ label, value }: StatusItemProps): JSX.Element {
  return (
    <div className="status-item">
      <span className="status-item__label">{label}</span>
      <span className="status-item__value">{value}</span>
    </div>
  )
}
