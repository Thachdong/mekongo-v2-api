import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Không có trong openapi.yml — giả định: có thì chỉ revoke đúng token này, không có thì revoke toàn bộ session. Xem task-plan.md mục 11.1.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
