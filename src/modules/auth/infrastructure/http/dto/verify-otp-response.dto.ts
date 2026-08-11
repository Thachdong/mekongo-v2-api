import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiPropertyOptional({
    description:
      'Present only for RESET_PASSWORD / CHANGE_PASSWORD purposes; pass to POST /auth/password/reset',
  })
  resetToken?: string;
}
