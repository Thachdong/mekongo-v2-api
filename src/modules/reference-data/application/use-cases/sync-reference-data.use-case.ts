import { Inject, Injectable } from '@nestjs/common';
import {
  REFERENCE_DATA_REPOSITORY,
  ReferenceDataRepositoryPort,
} from '../ports/reference-data.repository.port';
import { SyncReferenceDataInput } from '../dto/sync-reference-data-input.dto';

@Injectable()
export class SyncReferenceDataUseCase {
  constructor(
    @Inject(REFERENCE_DATA_REPOSITORY)
    private readonly referenceDataRepository: ReferenceDataRepositoryPort,
  ) {}

  execute(input: SyncReferenceDataInput): Promise<void> {
    return this.referenceDataRepository.replaceAll(input);
  }
}
