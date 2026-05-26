import type { FileProcessingErrorCode } from '../../../entities/image/types'

export type GB7ErrorCode = Extract<
  FileProcessingErrorCode,
  | 'GB7_INVALID_SIGNATURE'
  | 'GB7_UNSUPPORTED_VERSION'
  | 'GB7_INVALID_FLAGS'
  | 'GB7_INVALID_RESERVED_BYTES'
  | 'GB7_INVALID_DIMENSIONS'
  | 'GB7_INVALID_FILE_SIZE'
>

export class GB7CodecError extends Error {
  public readonly code: GB7ErrorCode

  public constructor(code: GB7ErrorCode, message: string) {
    super(message)
    this.name = 'GB7CodecError'
    this.code = code
  }
}
