import type { HistogramChannel, HistogramData } from '../types'

const HISTOGRAM_BIN_COUNT = 256

/**
 * Считает гистограмму на 256 столбцов по неизменяемому ImageData.
 * Master использует яркость, потому что она отражает воспринимаемую светлоту, а не отдельный RGB-компонент.
 */
export function calculateHistogram(imageData: ImageData, channel: HistogramChannel): HistogramData {
  const histogram: HistogramData = new Uint32Array(HISTOGRAM_BIN_COUNT)

  for (let index = 0; index < imageData.data.length; index += 4) {
    const value: number = getChannelValue(imageData.data, index, channel)
    histogram[value] += 1
  }

  return histogram
}

function getChannelValue(data: Uint8ClampedArray, index: number, channel: HistogramChannel): number {
  if (channel === 'red') {
    return data[index]
  }

  if (channel === 'green') {
    return data[index + 1]
  }

  if (channel === 'blue') {
    return data[index + 2]
  }

  if (channel === 'alpha') {
    return data[index + 3]
  }

  return Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114)
}
