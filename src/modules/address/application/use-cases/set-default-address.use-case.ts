import { Inject, Injectable } from '@nestjs/common';

import {
  ADDRESS_REPOSITORY,
  AddressRepositoryPort,
} from '../ports/address.repository.port';
import { AddressView } from '../dto/address-view.dto';
import { AddressNotFoundError } from '../../domain/errors/address-domain.errors';

@Injectable()
export class SetDefaultAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepositoryPort,
  ) {}

  async execute(accountId: string, addressId: string): Promise<AddressView> {
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.accountId !== accountId) {
      throw new AddressNotFoundError();
    }

    if (address.isDefault) return address;

    return this.addressRepository.setDefault(accountId, addressId);
  }
}
