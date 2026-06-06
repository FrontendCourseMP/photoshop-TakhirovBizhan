import type { ImageFileFormat } from '../types'

const extensionToFormat: Readonly<Record<string, ImageFileFormat>> = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  gb7: 'gb7',
}

export function detectImageFileFormat(file: File): ImageFileFormat | null {
  // Для GB7 браузер не знает MIME type, поэтому сначала используем расширение.
  // MIME fallback нужен для обычных PNG/JPEG, где расширение может быть нестандартным.
  const extension: string | undefined = file.name.split('.').pop()?.toLowerCase()

  if (extension !== undefined && extension in extensionToFormat) {
    return extensionToFormat[extension]
  }

  if (file.type === 'image/png') {
    return 'png'
  }

  if (file.type === 'image/jpeg') {
    return 'jpeg'
  }

  return null
}

export function formatToExtension(format: ImageFileFormat): string {
  // Внутри приложения формат называется jpeg, а на диске чаще ожидается расширение .jpg.
  return format === 'jpeg' ? 'jpg' : format
}

export function replaceFileExtension(fileName: string, format: ImageFileFormat): string {
  // Экспорт должен сохранять исходное имя файла, но расширение должно соответствовать
  // реальному формату данных, который будет записан в Blob.
  const extension: string = formatToExtension(format)
  const withoutExtension: string = fileName.replace(/\.[^/.]+$/, '')

  return `${withoutExtension || 'image'}.${extension}`
}
