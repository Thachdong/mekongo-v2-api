import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

/** One @ApiResponse per status, schema fixed to ErrorResponseDto — pass every DomainError code that maps to `status` in `description`. */
export function ApiErrorResponse(status: number, description: string) {
  return applyDecorators(
    ApiResponse({ status, description, type: ErrorResponseDto }),
  );
}
