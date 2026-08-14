import { Inject, Injectable } from '@nestjs/common';
import {
  REFERENCE_DATA_REPOSITORY,
  ReferenceDataRepositoryPort,
} from '../ports/reference-data.repository.port';
import { WardView } from '../dto/ward-view.dto';

@Injectable()
export class ListWardsByProvinceUseCase {
  constructor(
    @Inject(REFERENCE_DATA_REPOSITORY)
    private readonly referenceDataRepository: ReferenceDataRepositoryPort,
  ) {}

  execute(provinceCodename: string): Promise<WardView[]> {
    return this.referenceDataRepository.findWardsByProvinceCodename(
      provinceCodename,
    );
  }
}
