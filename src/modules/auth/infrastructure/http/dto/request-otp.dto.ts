import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TOtpPurpose } from '../../../domain/otp-request.entity';

export type OtpPurposeApi = 'register' | 'reset_password';

export const OTP_PURPOSE_MAP: Record<OtpPurposeApi, TOtpPurpose> = {
  register: 'REGISTER',
  reset_password: 'RESET_PASSWORD',
};

export class RequestOtpDto {
  @ApiProperty({ enum: ['register', 'reset_password'] })
  @IsEnum(['register', 'reset_password'])
  purpose: OtpPurposeApi;

  @ApiPropertyOptional({
    description: 'Required for reset_password purpose',
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Required for reset_password (phone/email lookup)',
  })
  @IsOptional()
  @IsString()
  identifier?: string;
}
