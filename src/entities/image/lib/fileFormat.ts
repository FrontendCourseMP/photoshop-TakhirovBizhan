import type { ImageFileFormat } from '../types'

const extensionToFormat: Readonly<Record<string, ImageFileFormat>> = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  gb7: 'gb7',
}

export function detectImageFileFormat(file: File): ImageFileFormat | null {
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
  return format === 'jpeg' ? 'jpg' : format
}

export function replaceFileExtension(fileName: string, format: ImageFileFormat): string {
  const extension: string = formatToExtension(format)
  const withoutExtension: string = fileName.replace(/\.[^/.]+$/, '')

  return `${withoutExtension || 'image'}.${extension}`
}
