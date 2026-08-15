import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'key trả về từ POST /uploads/sign-url sau khi đã PUT file lên',
    example: 'tmp/accountId/uuid-avatar.png',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatarKey?: string;
}
