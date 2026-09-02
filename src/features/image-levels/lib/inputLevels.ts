// Геометрия входных уровней: перевод положения маркера на оси гистограммы в настройки Levels.
// Пиксели модуль не трогает, за преобразование яркости отвечает LUT.
import { clamp } from '../../../shared/lib/math/clamp'
import { GAMMA_RANGE } from '../model/defaultLevels'
import type { LevelsMarker, LevelsSettings } from '../types'

// LUT работает по 8-битной сетке, поэтому ось входных уровней всегда 0..255.
export const MAX_INPUT_LEVEL = 255

// Полутоновой маркер стоит там, где входная яркость после коррекции
// дает середину выходного диапазона.
const MIDTONE_OUTPUT = 0.5

export function gammaToMidtoneRatio(gamma: number): number {
  // Из normalized ** gamma === 0.5 следует, что доля диапазона равна 0.5 ** (1 / gamma).
  return MIDTONE_OUTPUT ** (1 / clamp(gamma, GAMMA_RANGE.min, GAMMA_RANGE.max))
}

// Границы хода полутонового маркера задаются самим диапазоном гаммы, а не отдельными числами:
// иначе маркер мог бы уехать в положение, которому не соответствует ни одно допустимое значение.
const MIN_MIDTONE_RATIO: number = Math.min(
  gammaToMidtoneRatio(GAMMA_RANGE.min),
  gammaToMidtoneRatio(GAMMA_RANGE.max),
)
const MAX_MIDTONE_RATIO: number = Math.max(
  gammaToMidtoneRatio(GAMMA_RANGE.min),
  gammaToMidtoneRatio(GAMMA_RANGE.max),
)

export function getMidtoneLevel(settings: LevelsSettings): number {
  // Позиция хранится как доля диапазона, поэтому при сдвиге черной или белой точки
  // полутоновой маркер сам остается между ними и гамму пересчитывать не нужно.
  const range: number = settings.whitePoint - settings.blackPoint

  return settings.blackPoint + range * gammaToMidtoneRatio(settings.gamma)
}

export function moveLevelsMarker(
  settings: LevelsSettings,
  marker: LevelsMarker,
  level: number,
): LevelsSettings {
  // Черная и белая точки расходятся минимум на один уровень: нулевой входной диапазон
  // сделал бы нормализацию пикселя делением на ноль.
  if (marker === 'black') {
    return {
      ...settings,
      blackPoint: clamp(Math.round(level), 0, settings.whitePoint - 1),
    }
  }

  if (marker === 'white') {
    return {
      ...settings,
      whitePoint: clamp(Math.round(level), settings.blackPoint + 1, MAX_INPUT_LEVEL),
    }
  }

  return {
    ...settings,
    gamma: levelToGamma(settings, level),
  }
}

export function getNearestMarker(settings: LevelsSettings, level: number): LevelsMarker {
  const distanceToBlack: number = Math.abs(level - settings.blackPoint)
  const distanceToMidtone: number = Math.abs(level - getMidtoneLevel(settings))
  const distanceToWhite: number = Math.abs(level - settings.whitePoint)

  // При равных расстояниях выигрывает более левый маркер: так щелчок по краю оси
  // не переставляет неожиданно белую точку в самое начало диапазона.
  if (distanceToBlack <= distanceToMidtone && distanceToBlack <= distanceToWhite) {
    return 'black'
  }

  return distanceToMidtone <= distanceToWhite ? 'midtone' : 'white'
}

export function levelToPercent(level: number): number {
  return (clamp(level, 0, MAX_INPUT_LEVEL) / MAX_INPUT_LEVEL) * 100
}

function levelToGamma(settings: LevelsSettings, level: number): number {
  const range: number = Math.max(settings.whitePoint - settings.blackPoint, 1)
  const ratio: number = clamp((level - settings.blackPoint) / range, MIN_MIDTONE_RATIO, MAX_MIDTONE_RATIO)
  const gamma: number = Math.log(MIDTONE_OUTPUT) / Math.log(ratio)

  // Два знака после запятой держат подпись маркера читаемой и совпадают с шагом ручного ввода.
  return clamp(Math.round(gamma * 100) / 100, GAMMA_RANGE.min, GAMMA_RANGE.max)
}
