import { AddressView } from '../dto/address-view.dto';

export interface CreateAddressData {
  accountId: string;
  label?: string;
  street: string;
  ward: string;
  provinceId: string;
  isDefault: boolean;
}

export interface AddressRepositoryPort {
  countByAccountId(accountId: string): Promise<number>;

  findManyByAccountId(accountId: string): Promise<AddressView[]>;

  /** Nếu isDefault=true, unset default của các address khác cùng account trong cùng transaction. */
  create(data: CreateAddressData): Promise<AddressView>;
}

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');
