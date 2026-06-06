// Один bin хранит количество пикселей с конкретной яркостью 0..255.
export type HistogramBin = number

// Uint32Array выбран для компактного хранения 256 bins и быстрых проходов по данным.
export type HistogramData = Uint32Array

// Mode меняет только визуализацию высоты bars, сами bins остаются одинаковыми.
export type HistogramMode = 'linear' | 'log'

// Master использует luminance, остальные значения читают конкретный RGBA-канал.
export type HistogramChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha'
