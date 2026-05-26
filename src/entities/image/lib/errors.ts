import type { FileProcessingError, FileProcessingErrorCode } from '../types'

export function createFileProcessingError(
  code: FileProcessingErrorCode,
  message: string,
  cause?: unknown,
): FileProcessingError {
  return {
    code,
    message,
    cause,
  }
}
