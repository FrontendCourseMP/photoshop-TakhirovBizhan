import type { LevelsState } from '../types'
import { createLevelsLUT } from './levelsLut'

interface LevelsLuts {
  readonly master: Uint8Array
  readonly red: Uint8Array
  readonly green: Uint8Array
  readonly blue: Uint8Array
  readonly alpha: Uint8Array
}

/**
 * Применяет Levels без мутации исходного ImageData.
 * Порядок важен: сначала Master меняет RGB, затем канальные LUT уточняют RGB, а Alpha обрабатывается отдельно.
 */
export function applyLevels(source: ImageData, levelsState: LevelsState): ImageData {
  const outputBuffer: ArrayBuffer = new ArrayBuffer(source.data.length)
  const outputData: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(outputBuffer)
  // LUT создаются один раз на канал, чтобы в основном цикле по пикселям были только обращения по индексу.
  const luts: LevelsLuts = {
    master: createLevelsLUT(levelsState.master),
    red: createLevelsLUT(levelsState.red),
    green: createLevelsLUT(levelsState.green),
    blue: createLevelsLUT(levelsState.blue),
    alpha: createLevelsLUT(levelsState.alpha),
  }

  for (let index = 0; index < source.data.length; index += 4) {
    // Master применяется первым ко всем RGB-каналам; Alpha не участвует в Master по правилам Levels.
    const masterRed: number = luts.master[source.data[index]]
    const masterGreen: number = luts.master[source.data[index + 1]]
    const masterBlue: number = luts.master[source.data[index + 2]]

    outputData[index] = luts.red[masterRed]
    outputData[index + 1] = luts.green[masterGreen]
    outputData[index + 2] = luts.blue[masterBlue]
    outputData[index + 3] = luts.alpha[source.data[index + 3]]
  }

  return new ImageData(outputData, source.width, source.height)
}
