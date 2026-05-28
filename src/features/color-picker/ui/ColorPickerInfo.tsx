import type { JSX } from 'react'
import { rgbToHex } from '../../../shared/lib/color'
import type { ColorPickerResult } from '../types'

interface ColorPickerInfoProps {
  readonly result: ColorPickerResult | null
}

export function ColorPickerInfo({ result }: ColorPickerInfoProps): JSX.Element {
  const hexColor: string | null = result === null ? null : rgbToHex(result.pixel.rgba)
  const swatchColor: string | undefined =
    result === null
      ? undefined
      : `rgba(${result.pixel.rgba.r}, ${result.pixel.rgba.g}, ${result.pixel.rgba.b}, ${
          result.pixel.rgba.a / 255
        })`

  return (
    <section className="color-picker-info" aria-label="Color picker result">
      <div className="panel-heading">
        <h2>Пипетка</h2>
        <span>Source color</span>
      </div>

      {result === null ? (
        <div className="panel-empty">Активируйте пипетку и кликните по изображению</div>
      ) : (
        <div className="color-picker-result">
          <div className="picked-color-preview">
            <span className="picked-color-swatch" aria-label="Selected color preview">
              <span className="picked-color-swatch__fill" style={{ backgroundColor: swatchColor }} />
            </span>
            <strong>{hexColor}</strong>
          </div>

          <div className="color-info-grid">
            <InfoItem label="X" value={result.pixel.coordinates.x.toString()} />
            <InfoItem label="Y" value={result.pixel.coordinates.y.toString()} />
            <InfoItem label="R" value={result.pixel.rgba.r.toString()} />
            <InfoItem label="G" value={result.pixel.rgba.g.toString()} />
            <InfoItem label="B" value={result.pixel.rgba.b.toString()} />
            <InfoItem label="A" value={result.pixel.rgba.a.toString()} />
            <InfoItem label="L" value={result.pixel.lab.l.toFixed(2)} />
            <InfoItem label="a" value={result.pixel.lab.a.toFixed(2)} />
            <InfoItem label="b" value={result.pixel.lab.b.toFixed(2)} />
          </div>
        </div>
      )}
    </section>
  )
}

interface InfoItemProps {
  readonly label: string
  readonly value: string
}

function InfoItem({ label, value }: InfoItemProps): JSX.Element {
  return (
    <div className="color-info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
