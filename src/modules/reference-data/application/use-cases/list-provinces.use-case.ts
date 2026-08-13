import { Inject, Injectable } from '@nestjs/common';
import {
  REFERENCE_DATA_REPOSITORY,
  ReferenceDataRepositoryPort,
} from '../ports/reference-data.repository.port';
import { ProvinceView } from '../dto/province-view.dto';

@Injectable()
export class ListProvincesUseCase {
  constructor(
    @Inject(REFERENCE_DATA_REPOSITORY)
    private readonly referenceDataRepository: ReferenceDataRepositoryPort,
  ) {}

  execute(): Promise<ProvinceView[]> {
    return this.referenceDataRepository.findAllProvinces();
  }
}
