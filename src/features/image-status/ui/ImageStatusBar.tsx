import type { JSX } from 'react'
import type { ImageMetadata } from '../../../entities/image/types'

interface ImageStatusBarProps {
  readonly metadata: ImageMetadata | null
  readonly displayScalePercent: number
}

export function ImageStatusBar({ metadata, displayScalePercent }: ImageStatusBarProps): JSX.Element {
  const megapixels: string = metadata === null ? '-' : `${roundMegapixels(metadata.width * metadata.height)} MP`

  return (
    <footer className="status-bar" aria-label="Image status">
      <StatusItem label="Width" value={metadata === null ? '-' : `${metadata.width}px`} />
      <StatusItem label="Height" value={metadata === null ? '-' : `${metadata.height}px`} />
      <StatusItem label="Depth" value={metadata === null ? '-' : `${metadata.colorDepth} bit`} />
      <StatusItem label="Format" value={metadata === null ? '-' : metadata.format.toUpperCase()} />
      <StatusItem label="Scale" value={metadata === null ? '-' : `${displayScalePercent}%`} />
      <StatusItem label="Megapixels" value={megapixels} />
    </footer>
  )
}

function roundMegapixels(pixels: number): number {
  return Math.round((pixels / 1_000_000) * 100) / 100
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
