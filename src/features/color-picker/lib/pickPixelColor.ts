import { rgbToCielab } from '../../../shared/lib/color'
import type { RGBAColor } from '../../../shared/types/color'
import type { ColorPickerMode, ColorPickerResult, ImageCoordinates } from '../types'
import { DEFAULT_COLOR_PICKER_MODE } from '../model/colorPickerState'

export function pickPixelColor(
  imageData: ImageData,
  coordinates: ImageCoordinates,
  mode: ColorPickerMode = DEFAULT_COLOR_PICKER_MODE,
): ColorPickerResult | null {
  // Цвет читается из исходного ImageData, а не из DOM, чтобы результат не зависел
  // от CSS-масштаба canvas и визуальных эффектов отображения.
  if (!isInsideImage(imageData, coordinates)) {
    return null
  }

  // В ImageData каждый пиксель занимает 4 последовательных байта RGBA.
  // Смещение считается от координат изображения, уже нормализованных canvasCoordinates.
  const pixelIndex: number = (coordinates.y * imageData.width + coordinates.x) * 4
  const rgba: RGBAColor = {
    r: imageData.data[pixelIndex],
    g: imageData.data[pixelIndex + 1],
    b: imageData.data[pixelIndex + 2],
    a: imageData.data[pixelIndex + 3],
  }

  return {
    mode,
    pixel: {
      coordinates,
      rgba,
      // LAB считается сразу вместе с RGB, чтобы UI не дублировал color math.
      lab: rgbToCielab(rgba),
    },
  }
}

function isInsideImage(imageData: ImageData, coordinates: ImageCoordinates): boolean {
  // Защита нужна не только для mouse-событий: функцию можно переиспользовать
  // с координатами из других источников, где нет DOMRect-проверки.
  return (
    coordinates.x >= 0 &&
    coordinates.y >= 0 &&
    coordinates.x < imageData.width &&
    coordinates.y < imageData.height
  )
}
