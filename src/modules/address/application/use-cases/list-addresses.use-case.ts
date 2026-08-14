import { Inject, Injectable } from '@nestjs/common';

import {
  ADDRESS_REPOSITORY,
  AddressRepositoryPort,
} from '../ports/address.repository.port';
import { AddressView } from '../dto/address-view.dto';

@Injectable()
export class ListAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepositoryPort,
  ) {}

  execute(accountId: string): Promise<AddressView[]> {
    return this.addressRepository.findManyByAccountId(accountId);
  }
}
