import type { CSSProperties, JSX } from 'react'

interface OperationLoaderProps {
  readonly active: boolean
  readonly label: string
  readonly delayMs?: number
  readonly variant?: 'overlay' | 'inline'
}

export function OperationLoader({
  active,
  label,
  delayMs = 180,
  variant = 'inline',
}: OperationLoaderProps): JSX.Element | null {
  if (!active) {
    return null
  }

  // Задержка появления через CSS-переменную скрывает мигание loader на быстрых операциях.
  const style: CSSProperties & { readonly '--loader-delay': string } = {
    '--loader-delay': `${delayMs}ms`,
  }

  return (
    <div
      className={variant === 'overlay' ? 'loader loader--overlay' : 'loader'}
      style={style}
      role="status"
      aria-live="polite"
    >
      <span className="loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
