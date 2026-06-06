import type { InterpolationAlgorithm } from '../types'
import { resizeBilinear, resizeNearestNeighbor } from '../lib/resizeAlgorithms'

export const MAX_IMAGE_SIZE = 10000

// Bilinear выбран по умолчанию как более универсальный метод для фотографий.
export const DEFAULT_RESIZE_METHOD = 'bilinear' as const

// Список алгоритмов хранит и описание для UI, и ссылку на реализацию.
// Это позволяет добавлять новые методы без изменения ResizeImageDialog.
export const INTERPOLATION_ALGORITHMS: readonly InterpolationAlgorithm[] = [
  {
    id: 'nearest-neighbor',
    label: 'Nearest Neighbor',
    description: 'Самый быстрый метод: сохраняет резкие границы, подходит для pixel-art, но может давать ступенчатость.',
    resize: resizeNearestNeighbor,
  },
  {
    id: 'bilinear',
    label: 'Bilinear',
    description: 'Более плавный метод для фотографий: смешивает соседние пиксели и может слегка размывать изображение.',
    resize: resizeBilinear,
  },
]
