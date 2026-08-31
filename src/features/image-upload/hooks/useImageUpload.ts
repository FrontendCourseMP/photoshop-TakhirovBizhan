import { useRef, useState } from 'react'
import type { DragEvent as ReactDragEvent } from 'react'
import type { EditableImage, FileProcessingError, ImageLoadResult } from '../../../entities/image/types'
import { ACCEPTED_IMAGE_INPUT_TYPES } from '../../../shared/constants/fileFormats'
import { loadImageFile } from '../model/loadImageFile'

interface UseImageUploadOptions {
  readonly onImageLoaded: (image: EditableImage) => void
  readonly onError: (error: FileProcessingError) => void
}

interface DropZoneProps {
  readonly onDragEnter: (event: ReactDragEvent<HTMLElement>) => void
  readonly onDragOver: (event: ReactDragEvent<HTMLElement>) => void
  readonly onDragLeave: (event: ReactDragEvent<HTMLElement>) => void
  readonly onDrop: (event: ReactDragEvent<HTMLElement>) => void
}

export interface UseImageUploadResult {
  readonly isLoading: boolean
  readonly isDragActive: boolean
  readonly openFileDialog: () => void
  readonly dropZoneProps: DropZoneProps
}

/**
 * Единая точка открытия файла: кнопка тулбара, пустое состояние canvas и drag & drop
 * работают через один hook, поэтому декодирование и обработка ошибок не дублируются.
 */
export function useImageUpload({ onImageLoaded, onError }: UseImageUploadOptions): UseImageUploadResult {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDragActive, setIsDragActive] = useState<boolean>(false)
  // Вложенные элементы генерируют свои dragenter/dragleave, поэтому подсветку
  // держим на счетчике, а не на одном событии.
  const dragDepthRef = useRef<number>(0)

  async function loadFile(file: File): Promise<void> {
    setIsLoading(true)

    const result: ImageLoadResult = await loadImageFile(file)

    if (result.ok) {
      onImageLoaded(result.image)
    } else {
      onError(result.error)
    }

    setIsLoading(false)
  }

  function openFileDialog(): void {
    // Input создается на месте вместо скрытого элемента в разметке: одноразовый элемент
    // не нужно сбрасывать между выборами и он не участвует в фокусе и tab-порядке.
    const input: HTMLInputElement = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_IMAGE_INPUT_TYPES

    input.addEventListener('change', (): void => {
      const file: File | undefined = input.files?.[0]

      if (file !== undefined) {
        void loadFile(file)
      }
    })

    input.click()
  }

  function resetDragState(): void {
    dragDepthRef.current = 0
    setIsDragActive(false)
  }

  return {
    isLoading,
    isDragActive,
    openFileDialog,
    dropZoneProps: {
      onDragEnter: (event: ReactDragEvent<HTMLElement>): void => {
        if (!containsFiles(event.dataTransfer)) {
          return
        }

        event.preventDefault()
        dragDepthRef.current += 1
        setIsDragActive(true)
      },
      onDragOver: (event: ReactDragEvent<HTMLElement>): void => {
        if (!containsFiles(event.dataTransfer)) {
          return
        }

        // Без preventDefault браузер откроет файл вместо передачи его в onDrop.
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      },
      onDragLeave: (event: ReactDragEvent<HTMLElement>): void => {
        if (!containsFiles(event.dataTransfer)) {
          return
        }

        dragDepthRef.current -= 1

        if (dragDepthRef.current <= 0) {
          resetDragState()
        }
      },
      onDrop: (event: ReactDragEvent<HTMLElement>): void => {
        if (!containsFiles(event.dataTransfer)) {
          return
        }

        event.preventDefault()
        resetDragState()

        const file: File | undefined = event.dataTransfer.files[0]

        if (file !== undefined) {
          void loadFile(file)
        }
      },
    },
  }
}

function containsFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes('Files')
}
