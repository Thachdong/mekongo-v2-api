import { Module } from '@nestjs/common';

import { REFERENCE_DATA_REPOSITORY } from './application/ports/reference-data.repository.port';
import { PrismaReferenceDataRepository } from './infrastructure/persistence/prisma-reference-data.repository';
import { ListProvincesUseCase } from './application/use-cases/list-provinces.use-case';
import { ListWardsByProvinceUseCase } from './application/use-cases/list-wards-by-province.use-case';
import { SyncReferenceDataUseCase } from './application/use-cases/sync-reference-data.use-case';
import { ReferenceDataController } from './infrastructure/http/reference-data.controller';

@Module({
  controllers: [ReferenceDataController],
  providers: [
    {
      provide: REFERENCE_DATA_REPOSITORY,
      useClass: PrismaReferenceDataRepository,
    },
    ListProvincesUseCase,
    ListWardsByProvinceUseCase,
    SyncReferenceDataUseCase,
  ],
})
export class ReferenceDataModule {}
