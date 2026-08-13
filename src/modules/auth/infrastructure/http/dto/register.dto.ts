import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AddressInputDto {
  @ApiPropertyOptional({ example: 'Nhà riêng' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provinceId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class RegisterDto {
  @ApiProperty({ enum: ['phone', 'email'] })
  @IsEnum(['phone', 'email'])
  loginType: 'phone' | 'email';

  @ApiProperty({ description: 'Phone number or email, matching loginType' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: AddressInputDto })
  @ValidateNested()
  @Type(() => AddressInputDto)
  address: AddressInputDto;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL'] })
  @IsOptional()
  @IsEnum(['INDIVIDUAL'])
  profileType?: 'INDIVIDUAL';
}
