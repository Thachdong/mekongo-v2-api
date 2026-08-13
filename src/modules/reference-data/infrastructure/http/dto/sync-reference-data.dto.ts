import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SyncProvinceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codename: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SyncWardDto extends SyncProvinceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provinceCodename: string;
}

export class SyncReferenceDataDto {
  @ApiProperty({ type: [SyncProvinceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncProvinceDto)
  provinces: SyncProvinceDto[];

  @ApiProperty({ type: [SyncWardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncWardDto)
  wards: SyncWardDto[];
}
