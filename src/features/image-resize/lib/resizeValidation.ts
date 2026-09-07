import type { ImageSize } from '../../../shared/types/imageSize'
import { MAX_IMAGE_SIZE } from '../model/resizeConstants'
import type { ResizeInputMode, ResizeSettings, ResizeStats, ResizeValidationResult } from '../types'

export function validateResizeSettings(settings: ResizeSettings): ResizeValidationResult {
  const targetSize: ImageSize = getTargetSizeFromSettings(settings)

  // Валидация выполняется до запуска тяжелого resize, чтобы Apply не создавал огромные или невалидные буферы.
  if (!isValidFiniteNumber(settings.width) || !isValidFiniteNumber(settings.height)) {
    return {
      ok: false,
      message: 'Width and height must be positive finite numbers.',
    }
  }

  if (targetSize.width < 1 || targetSize.height < 1) {
    return {
      ok: false,
      message: 'The result must be at least 1 × 1 pixels.',
    }
  }

  if (targetSize.width > MAX_IMAGE_SIZE || targetSize.height > MAX_IMAGE_SIZE) {
    return {
      ok: false,
      message: `The result must not exceed ${MAX_IMAGE_SIZE} × ${MAX_IMAGE_SIZE} pixels.`,
    }
  }

  return {
    ok: true,
    message: null,
  }
}

export function getTargetSizeFromSettings(settings: ResizeSettings): ImageSize {
  // settings.width/height уже хранятся в пикселях независимо от inputMode (см. ResizeSettings),
  //  здесь остается только округление и защита от нулевого/отрицательного размера.
  return {
    width: Math.max(Math.round(settings.width), 1),
    height: Math.max(Math.round(settings.height), 1),
  }
}

/**
 * Переводит хранящийся в пикселях размер в число, которое должно показывать поле ввода:
 * сами пиксели для режима pixels или процент от исходной стороны для режима percent.
 */
export function getDisplayDimensionValue(
  pixels: number,
  dimension: 'width' | 'height',
  inputMode: ResizeInputMode,
  sourceSize: ImageSize,
): number {
  if (inputMode === 'pixels') {
    return pixels
  }

  const sourceDimension: number = dimension === 'width' ? sourceSize.width : sourceSize.height

  return Math.round((pixels / sourceDimension) * 100)
}

/**
 * Обратное преобразование: то, что ввел пользователь в поле (пиксели или проценты),
 * переводится в пиксели, потому что settings.width/height хранятся только в пикселях.
 */
export function parseDisplayDimensionValue(
  displayValue: number,
  dimension: 'width' | 'height',
  inputMode: ResizeInputMode,
  sourceSize: ImageSize,
): number {
  if (inputMode === 'pixels') {
    return displayValue
  }

  const sourceDimension: number = dimension === 'width' ? sourceSize.width : sourceSize.height

  return (sourceDimension * displayValue) / 100
}

export function calculateAspectRatioSize(
  sourceSize: ImageSize,
  changedDimension: 'width' | 'height',
  value: number,
): ImageSize {
  const aspectRatio: number = sourceSize.width / sourceSize.height

  // Пересчет идет от исходного aspect ratio, чтобы ошибки округления не копились при последовательном вводе.
  if (changedDimension === 'width') {
    return {
      width: Math.max(Math.round(value), 1),
      height: Math.max(Math.round(value / aspectRatio), 1),
    }
  }

  return {
    width: Math.max(Math.round(value * aspectRatio), 1),
    height: Math.max(Math.round(value), 1),
  }
}

export function calculateResizeStats(sourceSize: ImageSize, targetSize: ImageSize): ResizeStats {
  const beforePixels: number = sourceSize.width * sourceSize.height
  const afterPixels: number = targetSize.width * targetSize.height

  return {
    beforePixels,
    afterPixels,
    beforeMegapixels: roundMegapixels(beforePixels),
    afterMegapixels: roundMegapixels(afterPixels),
  }
}

function isValidFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value) && value > 0
}

function roundMegapixels(pixels: number): number {
  return Math.round((pixels / 1_000_000) * 100) / 100
}
