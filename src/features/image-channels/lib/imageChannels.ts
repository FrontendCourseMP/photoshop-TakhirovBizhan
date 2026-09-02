// Разбор ImageData на каналы: сборка отображаемой копии для canvas и построение миниатюр.
// Исходный массив пикселей модуль не меняет, поэтому пипетка и экспорт работают с полными данными.
import type { ChannelPreviewImage, ChannelPreviewKind, ChannelsState } from '../types'

export function applyChannelsToImageData(
  source: ImageData,
  channels: ChannelsState,
  hasAlphaChannel: boolean,
): ImageData {
  const output: ImageData = createEmptyImageData(source.width, source.height)
  // Маска прозрачности показывается только тогда, когда альфа есть в самом формате файла.
  // Для RGB или grayscale без альфы погашенные цветовые каналы должны давать черный кадр,
  // а не белую заливку из полностью непрозрачных пикселей.
  const showAlphaMask: boolean =
    hasAlphaChannel && channels.alpha && !channels.red && !channels.green && !channels.blue

  for (let index = 0; index < source.data.length; index += 4) {
    const red: number = source.data[index]
    const green: number = source.data[index + 1]
    const blue: number = source.data[index + 2]
    const alpha: number = source.data[index + 3]

    if (showAlphaMask) {
      // Альфа переносится в яркость и делается непрозрачной, иначе прозрачные области
      // остались бы невидимыми и маску нельзя было бы рассмотреть.
      output.data[index] = alpha
      output.data[index + 1] = alpha
      output.data[index + 2] = alpha
      output.data[index + 3] = 255
      continue
    }

    output.data[index] = channels.red ? red : 0
    output.data[index + 1] = channels.green ? green : 0
    output.data[index + 2] = channels.blue ? blue : 0
    output.data[index + 3] = channels.alpha ? alpha : 0
  }

  return output
}

export function createChannelPreviews(
  source: ImageData,
  kinds: readonly ChannelPreviewKind[],
): readonly ChannelPreviewImage[] {
  // Состав миниатюр приходит снаружи: у grayscale-файла нет отдельных R, G и B,
  // и панель не должна показывать каналы, которых в формате не существует.
  return kinds.map((kind: ChannelPreviewKind): ChannelPreviewImage => {
    return {
      kind,
      imageData: createChannelPreviewImageData(source, kind),
    }
  })
}

export function createChannelPreviewImageData(source: ImageData, kind: ChannelPreviewKind): ImageData {
  const output: ImageData = createEmptyImageData(source.width, source.height)

  for (let index = 0; index < source.data.length; index += 4) {
    const intensity: number = readChannelIntensity(source.data, index, kind)

    // Превью строится в градациях серого: белый - максимум интенсивности канала, черный - его отсутствие.
    // Непрозрачность фиксируется, иначе миниатюра альфы растворилась бы в фоне панели.
    output.data[index] = intensity
    output.data[index + 1] = intensity
    output.data[index + 2] = intensity
    output.data[index + 3] = 255
  }

  return output
}

function readChannelIntensity(data: Uint8ClampedArray, index: number, kind: ChannelPreviewKind): number {
  if (kind === 'red') {
    return data[index]
  }

  if (kind === 'green') {
    return data[index + 1]
  }

  if (kind === 'blue') {
    return data[index + 2]
  }

  if (kind === 'alpha') {
    return data[index + 3]
  }

  // Яркость считается по весам восприятия: зеленый вносит в нее больше, чем красный и синий.
  return Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114)
}

function createEmptyImageData(width: number, height: number): ImageData {
  const buffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
  const data: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(buffer)

  return new ImageData(data, width, height)
}
