import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/kernel/domain-error';

export class UnsupportedContentTypeError extends DomainError {
  readonly code = 'UNSUPPORTED_CONTENT_TYPE';
  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor(contentType: string) {
    super(`Content type "${contentType}" is not allowed`);
  }
}

export class FileSizeExceededError extends DomainError {
  readonly code = 'FILE_SIZE_EXCEEDED';
  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor(maxSizeBytes: number) {
    super(`File size exceeds the limit of ${maxSizeBytes} bytes`);
  }
}
