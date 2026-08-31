import { useState } from 'react'
import type { JSX } from 'react'
import { rgbToHex } from '../../../shared/lib/color'
import { Icon } from '../../../shared/ui/Icon'
import type { ColorPickerResult } from '../types'

interface ColorPickerInfoProps {
  readonly isPickerActive: boolean
  readonly result: ColorPickerResult | null
}

export function ColorPickerInfo({ isPickerActive, result }: ColorPickerInfoProps): JSX.Element {
  // HEX и swatch являются только представлением уже выбранного цвета.
  // Расчет координат, RGBA и LAB выполняется в feature lib, а не в UI.
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const hexColor: string | null = result === null ? null : rgbToHex(result.pixel.rgba)
  const swatchColor: string | undefined =
    result === null
      ? undefined
      : `rgba(${result.pixel.rgba.r}, ${result.pixel.rgba.g}, ${result.pixel.rgba.b}, ${result.pixel.rgba.a / 255})`

  async function handleCopy(): Promise<void> {
    if (hexColor === null) {
      return
    }

    try {
      await navigator.clipboard.writeText(hexColor)
      setIsCopied(true)
      window.setTimeout((): void => {
        setIsCopied(false)
      }, 1200)
    } catch {
      // Clipboard может быть недоступен без пользовательского разрешения:
      // в этом случае значение остается видимым в панели и его можно выделить вручную.
      setIsCopied(false)
    }
  }

  return (
    <section className="panel" aria-label="Eyedropper result">
      <header className="panel__header">
        <h2>Eyedropper</h2>
        <span className={isPickerActive ? 'badge badge--accent' : 'badge'}>{isPickerActive ? 'On' : 'Off'}</span>
      </header>

      {result === null ? (
        <p className="panel__empty">
          {isPickerActive ? 'Click the image to sample a pixel' : 'Turn the eyedropper on, then click the image'}
        </p>
      ) : (
        <div className="panel__body">
          <div className="picked-color">
            <span className="swatch" aria-label="Sampled color">
              <span className="swatch__fill" style={{ backgroundColor: swatchColor }} />
            </span>
            <strong className="picked-color__hex">{hexColor}</strong>
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              title="Copy HEX"
              aria-label="Copy HEX"
              onClick={() => {
                void handleCopy()
              }}
            >
              <Icon name={isCopied ? 'check' : 'copy'} />
            </button>
          </div>

          <ReadoutGroup
            label="Position"
            items={[
              { label: 'X', value: result.pixel.coordinates.x.toString() },
              { label: 'Y', value: result.pixel.coordinates.y.toString() },
            ]}
          />
          <ReadoutGroup
            label="RGBA"
            items={[
              { label: 'R', value: result.pixel.rgba.r.toString() },
              { label: 'G', value: result.pixel.rgba.g.toString() },
              { label: 'B', value: result.pixel.rgba.b.toString() },
              { label: 'A', value: result.pixel.rgba.a.toString() },
            ]}
          />
          <ReadoutGroup
            label="CIELAB"
            items={[
              { label: 'L', value: result.pixel.lab.l.toFixed(2) },
              { label: 'a', value: result.pixel.lab.a.toFixed(2) },
              { label: 'b', value: result.pixel.lab.b.toFixed(2) },
            ]}
          />
        </div>
      )}
    </section>
  )
}

interface ReadoutItem {
  readonly label: string
  readonly value: string
}

interface ReadoutGroupProps {
  readonly label: string
  readonly items: readonly ReadoutItem[]
}

function ReadoutGroup({ label, items }: ReadoutGroupProps): JSX.Element {
  return (
    <div className="readout-group">
      <span className="readout-group__label">{label}</span>
      <div className="readout-group__items">
        {items.map((item: ReadoutItem) => (
          <div className="readout" key={item.label}>
            <span className="readout__label">{item.label}</span>
            <strong className="readout__value">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
