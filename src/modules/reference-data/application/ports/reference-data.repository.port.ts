import { ProvinceView } from '../dto/province-view.dto';
import { WardView } from '../dto/ward-view.dto';
import { SyncReferenceDataInput } from '../dto/sync-reference-data-input.dto';

export interface ReferenceDataRepositoryPort {
  findAllProvinces(): Promise<ProvinceView[]>;

  findWardsByProvinceCodename(provinceCodename: string): Promise<WardView[]>;

  replaceAll(input: SyncReferenceDataInput): Promise<void>;
}

export const REFERENCE_DATA_REPOSITORY = Symbol('REFERENCE_DATA_REPOSITORY');
