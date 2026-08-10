import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ enum: ['phone', 'email'] })
  @IsEnum(['phone', 'email'])
  loginType: 'phone' | 'email';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
