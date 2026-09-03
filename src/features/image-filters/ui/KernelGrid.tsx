import { useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import type { Kernel3x3 } from '../types'

interface KernelGridProps {
  readonly kernel: Kernel3x3
  readonly onKernelChange: (kernel: Kernel3x3) => void
}

interface CellDraft {
  readonly index: number
  readonly text: string
}

export function KernelGrid({ kernel, onKernelChange }: KernelGridProps): JSX.Element {
  // Промежуточный текст редактируемой ячейки хранится отдельно от матрицы: строки
  // вроде "-" или "0." числами не являются, но без них нельзя набрать отрицательное
  // или дробное значение - контролируемое поле возвращало бы курсор к прошлому числу.
  const [draft, setDraft] = useState<CellDraft | null>(null)

  function handleCellChange(index: number, text: string): void {
    setDraft({ index, text })

    const value: number = Number(text)

    // В матрицу уходит только законченное число; незавершенный ввод остается в draft.
    if (text.trim() !== '' && Number.isFinite(value)) {
      onKernelChange(replaceKernelValue(kernel, index, value))
    }
  }

  function handleCellBlur(): void {
    // После потери фокуса ячейка снова показывает значение матрицы, а незавершенный ввод отбрасывается.
    setDraft(null)
  }

  return (
    <div className="kernel-grid" aria-label="Kernel 3 by 3">
      {kernel.map((value: number, index: number) => (
        <input
          className="input kernel-grid__cell"
          key={index}
          aria-label={`Kernel value ${index + 1}`}
          step={0.1}
          type="number"
          value={draft !== null && draft.index === index ? draft.text : value}
          onBlur={handleCellBlur}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleCellChange(index, event.currentTarget.value)
          }}
        />
      ))}
    </div>
  )
}

function replaceKernelValue(kernel: Kernel3x3, index: number, value: number): Kernel3x3 {
  // Копия создается перед изменением, чтобы не мутировать props и сохранить
  // предсказуемый flow обновления settings.
  const values: number[] = [...kernel]
  values[index] = value

  // Tuple Kernel3x3 гарантирует, что алгоритм свертки всегда получит ровно 9 чисел.
  return [
    values[0],
    values[1],
    values[2],
    values[3],
    values[4],
    values[5],
    values[6],
    values[7],
    values[8],
  ]
}
