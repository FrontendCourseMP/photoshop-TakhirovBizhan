/**
 * Уменьшает изображение до размера миниатюры.
 * Каналы извлекаются уже из компактной копии, поэтому панель не держит в памяти
 * несколько версий исходника.
 */
export function fitImageDataToBox(source: ImageData, maxSide: number): ImageData {
  const longestSide: number = Math.max(source.width, source.height)

  // Изображение меньше ограничения возвращается как есть: копировать нечего.
  if (!Number.isFinite(maxSide) || maxSide <= 0 || longestSide <= maxSide) {
    return source
  }

  const reduction: number = longestSide / maxSide
  const width: number = Math.max(Math.round(source.width / reduction), 1)
  const height: number = Math.max(Math.round(source.height / reduction), 1)
  const buffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
  const output: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(buffer)

  for (let targetY = 0; targetY < height; targetY += 1) {
    // Каждой точке миниатюры отвечает прямоугольник исходных пикселей без пересечений и пропусков.
    const sourceTop: number = Math.floor((targetY * source.height) / height)
    const sourceBottom: number = Math.max(Math.floor(((targetY + 1) * source.height) / height), sourceTop + 1)

    for (let targetX = 0; targetX < width; targetX += 1) {
      const sourceLeft: number = Math.floor((targetX * source.width) / width)
      const sourceRight: number = Math.max(Math.floor(((targetX + 1) * source.width) / width), sourceLeft + 1)

      writeAveragedPixel(source, output, targetY * width + targetX, sourceLeft, sourceTop, sourceRight, sourceBottom)
    }
  }

  return new ImageData(output, width, height)
}

function writeAveragedPixel(
  source: ImageData,
  output: Uint8ClampedArray,
  targetPixelIndex: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
): void {
  let red = 0
  let green = 0
  let blue = 0
  let alpha = 0

  // Усреднение всей области вместо выборки одного пикселя сохраняет детали при сильном уменьшении.
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const sourceOffset: number = (y * source.width + x) * 4

      red += source.data[sourceOffset]
      green += source.data[sourceOffset + 1]
      blue += source.data[sourceOffset + 2]
      alpha += source.data[sourceOffset + 3]
    }
  }

  const sampleCount: number = (bottom - top) * (right - left)
  const targetOffset: number = targetPixelIndex * 4

  output[targetOffset] = Math.round(red / sampleCount)
  output[targetOffset + 1] = Math.round(green / sampleCount)
  output[targetOffset + 2] = Math.round(blue / sampleCount)
  output[targetOffset + 3] = Math.round(alpha / sampleCount)
}
