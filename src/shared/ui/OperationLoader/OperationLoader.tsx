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

  const style: CSSProperties & { readonly '--operation-loader-delay': string } = {
    '--operation-loader-delay': `${delayMs}ms`,
  }

  return (
    <div
      className={variant === 'overlay' ? 'operation-loader operation-loader--overlay' : 'operation-loader'}
      style={style}
    >
      <span className="operation-loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
