import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

import { RequestUploadUrlUseCase } from '../../application/use-cases/request-upload-url.use-case';

import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { RequestUploadUrlResponseDto } from './dto/upload-response.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@Controller('uploads')
export class UploadController {
  constructor(
    private readonly requestUploadUrlUseCase: RequestUploadUrlUseCase,
  ) {}

  @Post('sign-url')
  @ApiOperation({
    summary:
      'Xin signed URL để client upload trực tiếp lên Firebase Storage (vào tmp/). Sau khi PUT xong, gửi key này kèm payload cho API đích (vd PATCH /account) — API đó tự move file + lưu data.',
  })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'UNSUPPORTED_CONTENT_TYPE | FILE_SIZE_EXCEEDED',
  )
  async signUrl(
    @Body() dto: RequestUploadUrlDto,
  ): Promise<RequestUploadUrlResponseDto> {
    return this.requestUploadUrlUseCase.execute({
      fileName: dto.fileName,
      contentType: dto.contentType,
      size: dto.size,
    });
  }
}
