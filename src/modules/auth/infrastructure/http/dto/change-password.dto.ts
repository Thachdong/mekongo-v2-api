import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'From /auth/otp/verify with purpose=change_password',
  })
  @IsString()
  resetToken: string;
}
