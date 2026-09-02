import { useId, useState } from 'react'
import type { JSX, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { Icon } from '../Icon'

interface TooltipProps {
  readonly label: string
  readonly children: ReactNode
}

/**
 * Подсказка у поля формы: кнопка-триггер и всплывающая панель с пояснением.
 * Интерактивные элементы внутрь передавать нельзя - панель скрывается при уходе
 * курсора и потере фокуса, поэтому до них не добраться.
 */
export function Tooltip({ label, children }: TooltipProps): JSX.Element {
  const bubbleId: string = useId()
  // Наведение и фокус отслеживаются отдельно: подсказка должна оставаться видимой,
  // пока держится хотя бы одно из них, иначе она гасла бы при уходе мыши с кнопки в фокусе.
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const isVisible: boolean = !isDismissed && (isHovered || isFocused)

  function handleKeyDown(event: ReactKeyboardEvent<HTMLSpanElement>): void {
    if (event.key !== 'Escape' || !isVisible) {
      return
    }

    // preventDefault снимает close request с открытого dialog: Escape при видимой подсказке
    // закрывает только ее, а не весь инструмент.
    event.preventDefault()
    event.stopPropagation()
    setIsDismissed(true)
  }

  return (
    <span className="tooltip" onKeyDown={handleKeyDown}>
      <button
        aria-describedby={bubbleId}
        aria-label={label}
        className="tooltip__trigger"
        type="button"
        onBlur={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsDismissed(false)
          setIsFocused(true)
        }}
        onPointerEnter={() => {
          setIsDismissed(false)
          setIsHovered(true)
        }}
        onPointerLeave={() => {
          setIsHovered(false)
        }}
      >
        <Icon name="info" size={14} />
      </button>

      {/* Панель остается в разметке и в accessibility tree всегда: aria-describedby должен
          указывать на существующий узел, а скрывает ее только оформление. */}
      <span
        className={isVisible ? 'tooltip__bubble tooltip__bubble--visible' : 'tooltip__bubble'}
        id={bubbleId}
        role="tooltip"
      >
        {children}
      </span>
    </span>
  )
}
