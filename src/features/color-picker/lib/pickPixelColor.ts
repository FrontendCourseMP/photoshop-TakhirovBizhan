import { rgbToCielab } from '../../../shared/lib/color'
import type { RGBAColor } from '../../../shared/types/color'
import type { ColorPickerMode, ColorPickerResult, ImageCoordinates } from '../types'
import { DEFAULT_COLOR_PICKER_MODE } from '../model/colorPickerState'

export function pickPixelColor(
  imageData: ImageData,
  coordinates: ImageCoordinates,
  mode: ColorPickerMode = DEFAULT_COLOR_PICKER_MODE,
): ColorPickerResult | null {
  if (!isInsideImage(imageData, coordinates)) {
    return null
  }

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
      lab: rgbToCielab(rgba),
    },
  }
}

function isInsideImage(imageData: ImageData, coordinates: ImageCoordinates): boolean {
  return (
    coordinates.x >= 0 &&
    coordinates.y >= 0 &&
    coordinates.x < imageData.width &&
    coordinates.y < imageData.height
  )
}
