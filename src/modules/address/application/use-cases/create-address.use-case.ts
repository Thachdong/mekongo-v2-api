import { Inject, Injectable } from '@nestjs/common';

import {
  ADDRESS_REPOSITORY,
  AddressRepositoryPort,
} from '../ports/address.repository.port';
import { AddressView } from '../dto/address-view.dto';

export interface CreateAddressInput {
  accountId: string;
  label?: string;
  street: string;
  ward: string;
  provinceId: string;
  isDefault?: boolean;
}

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepositoryPort,
  ) {}

  async execute(input: CreateAddressInput): Promise<AddressView> {
    const existingCount = await this.addressRepository.countByAccountId(
      input.accountId,
    );
    // Address đầu tiên của account luôn là default, bất kể client gửi gì.
    const isDefault = existingCount === 0 ? true : (input.isDefault ?? false);

    return this.addressRepository.create({
      accountId: input.accountId,
      label: input.label,
      street: input.street,
      ward: input.ward,
      provinceId: input.provinceId,
      isDefault,
    });
  }
}
