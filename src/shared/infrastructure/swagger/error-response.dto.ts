import { ApiProperty } from '@nestjs/swagger';

/** Shape thrown by GlobalExceptionFilter: {code, message, ...extra}. */
export class ErrorResponseDto {
  @ApiProperty({ example: 'INVALID_CREDENTIALS' })
  code: string;

  @ApiProperty({ example: 'Invalid identifier or password' })
  message: string;
}
