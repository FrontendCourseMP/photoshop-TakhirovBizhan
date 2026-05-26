import type { JSX } from 'react'
import type { ImageMetadata } from '../../../entities/image/types'

interface ImageStatusBarProps {
  readonly metadata: ImageMetadata | null
}

export function ImageStatusBar({ metadata }: ImageStatusBarProps): JSX.Element {
  return (
    <footer className="status-bar" aria-label="Image status">
      <StatusItem label="Width" value={metadata === null ? '-' : `${metadata.width}px`} />
      <StatusItem label="Height" value={metadata === null ? '-' : `${metadata.height}px`} />
      <StatusItem label="Depth" value={metadata === null ? '-' : `${metadata.colorDepth} bit`} />
      <StatusItem label="Format" value={metadata === null ? '-' : metadata.format.toUpperCase()} />
    </footer>
  )
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
