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

  findById(id: string): Promise<AddressView | null>;

  findManyByAccountId(accountId: string): Promise<AddressView[]>;

  /** Nếu isDefault=true, unset default của các address khác cùng account trong cùng transaction. */
  create(data: CreateAddressData): Promise<AddressView>;

  /** Unset default của các address khác cùng account rồi set address này thành default, trong cùng transaction. */
  setDefault(accountId: string, addressId: string): Promise<AddressView>;
}

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');
