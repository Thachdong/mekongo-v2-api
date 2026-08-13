import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@modules/auth/infrastructure/security/public.decorator';

import { ListProvincesUseCase } from '../../application/use-cases/list-provinces.use-case';
import { ListWardsByProvinceUseCase } from '../../application/use-cases/list-wards-by-province.use-case';
import { SyncReferenceDataUseCase } from '../../application/use-cases/sync-reference-data.use-case';

import { ProvinceResponseDto } from './dto/province-response.dto';
import { WardResponseDto } from './dto/ward-response.dto';
import { SyncReferenceDataDto } from './dto/sync-reference-data.dto';
import { ReferenceDataResponseMapper } from './mappers/reference-data.response.mapper';

@ApiTags('ReferenceData')
@Controller('reference-data')
export class ReferenceDataController {
  constructor(
    private readonly listProvincesUseCase: ListProvincesUseCase,
    private readonly listWardsByProvinceUseCase: ListWardsByProvinceUseCase,
    private readonly syncReferenceDataUseCase: SyncReferenceDataUseCase,
  ) {}

  @Get('provinces')
  @Public()
  @ApiOperation({ summary: 'List all provinces' })
  async listProvinces(): Promise<ProvinceResponseDto[]> {
    const provinces = await this.listProvincesUseCase.execute();
    return provinces.map(ReferenceDataResponseMapper.toProvinceApi);
  }

  @Get('provinces/:provinceCodename/wards')
  @Public()
  @ApiOperation({ summary: 'List wards of a province' })
  async listWards(
    @Param('provinceCodename') provinceCodename: string,
  ): Promise<WardResponseDto[]> {
    const wards = await this.listWardsByProvinceUseCase.execute(provinceCodename);
    return wards.map(ReferenceDataResponseMapper.toWardApi);
  }

  @Patch('address')
  @Public()
  @ApiOperation({
    summary: 'Replace all provinces/wards data (admin-formatted payload)',
  })
  async sync(@Body() dto: SyncReferenceDataDto): Promise<void> {
    await this.syncReferenceDataUseCase.execute(dto);
  }
}
