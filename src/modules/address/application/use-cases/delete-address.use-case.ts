import { Inject, Injectable } from '@nestjs/common';

import {
  ADDRESS_REPOSITORY,
  AddressRepositoryPort,
} from '../ports/address.repository.port';
import {
  AddressNotFoundError,
  CannotDeleteDefaultAddressError,
} from '../../domain/errors/address-domain.errors';

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepositoryPort,
  ) {}

  async execute(accountId: string, addressId: string): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.accountId !== accountId) {
      throw new AddressNotFoundError();
    }
    if (address.isDefault) {
      throw new CannotDeleteDefaultAddressError();
    }

    await this.addressRepository.delete(addressId);
  }
}
