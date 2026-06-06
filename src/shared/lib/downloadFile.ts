export function downloadBlob(blob: Blob, fileName: string): void {
  // Object URL дает браузеру временную ссылку на Blob без backend и без записи файла на диск.
  const url: string = URL.createObjectURL(blob)
  const anchor: HTMLAnchorElement = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()

  // URL освобождается сразу после запуска download, чтобы большие изображения не висели в памяти.
  URL.revokeObjectURL(url)
}
