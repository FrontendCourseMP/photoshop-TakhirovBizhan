import type { ImageSize } from '../../../shared/types/imageSize'
import { MAX_IMAGE_SIZE } from '../model/resizeConstants'
import type { ResizeSettings, ResizeStats, ResizeValidationResult } from '../types'

export function validateResizeSettings(settings: ResizeSettings, sourceSize: ImageSize): ResizeValidationResult {
  const targetSize: ImageSize = getTargetSizeFromSettings(settings, sourceSize)

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

export function getTargetSizeFromSettings(settings: ResizeSettings, sourceSize: ImageSize): ImageSize {
  // Алгоритмы resize работают в пикселях, поэтому percent-режим сначала переводится в итоговый ImageSize.
  if (settings.inputMode === 'percent') {
    return {
      width: Math.max(Math.round((sourceSize.width * settings.width) / 100), 1),
      height: Math.max(Math.round((sourceSize.height * settings.height) / 100), 1),
    }
  }

  return {
    width: Math.max(Math.round(settings.width), 1),
    height: Math.max(Math.round(settings.height), 1),
  }
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
