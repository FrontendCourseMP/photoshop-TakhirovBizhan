import type { ChangeEvent, JSX } from 'react'
import type { Kernel3x3 } from '../types'

interface KernelGridProps {
  readonly kernel: Kernel3x3
  readonly onKernelChange: (kernel: Kernel3x3) => void
}

export function KernelGrid({ kernel, onKernelChange }: KernelGridProps): JSX.Element {
  function handleKernelValueChange(index: number, value: number): void {
    // Копия kernel создается перед изменением, чтобы не мутировать props
    // и сохранить предсказуемый flow обновления settings.
    const nextKernel: number[] = [...kernel]
    nextKernel[index] = Number.isFinite(value) ? value : 0
    onKernelChange(toKernel3x3(nextKernel))
  }

  return (
    <div className="kernel-grid" aria-label="Kernel 3 by 3">
      {kernel.map((value: number, index: number) => (
        <input
          key={index}
          step={0.1}
          type="number"
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleKernelValueChange(index, Number(event.currentTarget.value))
          }}
        />
      ))}
    </div>
  )
}

function toKernel3x3(values: readonly number[]): Kernel3x3 {
  // Tuple Kernel3x3 гарантирует, что алгоритм свертки всегда получит ровно 9 чисел.
  // Недостающие значения заменяются нулями после ручного ввода.
  return [
    values[0] ?? 0,
    values[1] ?? 0,
    values[2] ?? 0,
    values[3] ?? 0,
    values[4] ?? 0,
    values[5] ?? 0,
    values[6] ?? 0,
    values[7] ?? 0,
    values[8] ?? 0,
  ]
}
