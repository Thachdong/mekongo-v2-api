import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ enum: ['phone', 'email'] })
  @IsEnum(['phone', 'email'])
  loginType: 'phone' | 'email';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
