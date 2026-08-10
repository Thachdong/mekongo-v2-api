import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty()
  @IsUUID()
  otpRequestId: string;

  @ApiProperty({ pattern: '^[0-9]{6}$' })
  @Matches(/^[0-9]{6}$/)
  code: string;
}
