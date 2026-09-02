import { useRef } from 'react'
import type { JSX, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  MAX_INPUT_LEVEL,
  getMidtoneLevel,
  getNearestMarker,
  levelToPercent,
  moveLevelsMarker,
} from '../lib/inputLevels'
import { GAMMA_RANGE } from '../model/defaultLevels'
import type { LevelsMarker, LevelsSettings } from '../types'

interface InputLevelsTrackProps {
  readonly settings: LevelsSettings
  readonly onChange: (settings: LevelsSettings) => void
}

interface MarkerView {
  readonly marker: LevelsMarker
  readonly title: string
  readonly level: number
  readonly value: number
  readonly minValue: number
  readonly maxValue: number
  readonly valueText: string
}

// Шаг клавиатуры измеряется в уровнях яркости: так все три маркера двигаются по одной сетке,
// даже если полутоновой хранит не уровень, а гамму.
const KEYBOARD_LEVEL_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  PageDown: -12,
  PageUp: 12,
}

const AXIS_TICKS: readonly number[] = [0, 64, 128, 192, 255]

/**
 * Ось входных уровней с тремя перетаскиваемыми маркерами под гистограммой.
 * Компонент только переводит положение курсора в уровень яркости, а ограничения
 * взаимного порядка маркеров держит lib.
 */
export function InputLevelsTrack({ settings, onChange }: InputLevelsTrackProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggedMarkerRef = useRef<LevelsMarker | null>(null)
  const midtoneLevel: number = getMidtoneLevel(settings)
  const markers: readonly MarkerView[] = [
    {
      marker: 'black',
      title: 'Black point',
      level: settings.blackPoint,
      value: settings.blackPoint,
      minValue: 0,
      maxValue: settings.whitePoint - 1,
      valueText: `Black point ${settings.blackPoint}`,
    },
    {
      marker: 'midtone',
      title: 'Midtones',
      level: midtoneLevel,
      value: settings.gamma,
      minValue: GAMMA_RANGE.min,
      maxValue: GAMMA_RANGE.max,
      valueText: `Gamma ${settings.gamma.toFixed(2)}`,
    },
    {
      marker: 'white',
      title: 'White point',
      level: settings.whitePoint,
      value: settings.whitePoint,
      minValue: settings.blackPoint + 1,
      maxValue: MAX_INPUT_LEVEL,
      valueText: `White point ${settings.whitePoint}`,
    },
  ]

  function readPointerLevel(clientX: number): number | null {
    const track: HTMLDivElement | null = trackRef.current

    if (track === null) {
      return null
    }

    // Ось растягивается по ширине диалога, поэтому уровень считается от реального DOMRect,
    // а не от фиксированного числа пикселей.
    const rect: DOMRect = track.getBoundingClientRect()

    if (rect.width <= 0) {
      return null
    }

    return ((clientX - rect.left) / rect.width) * MAX_INPUT_LEVEL
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const level: number | null = readPointerLevel(event.clientX)

    if (level === null) {
      return
    }

    // Захват указателя нужен, чтобы перетаскивание продолжалось за границами оси
    // и не прерывалось, когда курсор уходит на гистограмму или на поля ввода.
    const marker: LevelsMarker = getNearestMarker(settings, level)
    draggedMarkerRef.current = marker
    event.currentTarget.setPointerCapture(event.pointerId)
    onChange(moveLevelsMarker(settings, marker, level))
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const marker: LevelsMarker | null = draggedMarkerRef.current

    if (marker === null) {
      return
    }

    const level: number | null = readPointerLevel(event.clientX)

    if (level !== null) {
      onChange(moveLevelsMarker(settings, marker, level))
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    draggedMarkerRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleMarkerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, view: MarkerView): void {
    if (event.key === 'Home' || event.key === 'End') {
      // Крайние клавиши упираются в границы оси, а взаимный порядок маркеров поправит lib.
      event.preventDefault()
      onChange(moveLevelsMarker(settings, view.marker, event.key === 'Home' ? 0 : MAX_INPUT_LEVEL))
      return
    }

    const step: number | undefined = KEYBOARD_LEVEL_STEPS[event.key]

    if (step === undefined) {
      return
    }

    // preventDefault останавливает прокрутку диалога стрелками, пока маркер в фокусе.
    event.preventDefault()
    onChange(moveLevelsMarker(settings, view.marker, view.level + step))
  }

  return (
    <div className="levels-track">
      <div
        className="levels-track__axis"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="levels-track__ramp" aria-hidden="true" />
        {markers.map((view: MarkerView) => (
          <button
            aria-label={view.title}
            aria-orientation="horizontal"
            aria-valuemax={view.maxValue}
            aria-valuemin={view.minValue}
            aria-valuenow={view.value}
            aria-valuetext={view.valueText}
            className={`levels-marker levels-marker--${view.marker}`}
            key={view.marker}
            role="slider"
            style={{ left: `${levelToPercent(view.level)}%` }}
            tabIndex={0}
            title={view.valueText}
            type="button"
            onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => {
              handleMarkerKeyDown(event, view)
            }}
          />
        ))}
      </div>

      <div className="levels-track__ticks" aria-hidden="true">
        {AXIS_TICKS.map((tick: number) => (
          <span className="levels-track__tick" key={tick} style={{ left: `${levelToPercent(tick)}%` }}>
            {tick}
          </span>
        ))}
      </div>
    </div>
  )
}
