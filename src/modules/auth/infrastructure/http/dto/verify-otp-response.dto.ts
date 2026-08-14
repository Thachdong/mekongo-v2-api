import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiPropertyOptional({
    description:
      'Present only for RESET_PASSWORD purpose; pass to POST /auth/password/reset',
  })
  resetToken?: string;
}
