import { TLoginType } from '../../domain/value-objects/identifier.vo';
import { TProfileType } from '@modules/profile/public-api';

export interface RegisterAddressInput {
  label?: string;
  street: string;
  ward: string;
  district: string;
  provinceId: string;
  isDefault?: boolean;
}

export interface RegisterAccountTransactionResult {
  accountId: string;
  profileId: string;
}

export interface RegisterAccountTransactionPort {
  /** Tạo Account + Profile + Address trong 1 transaction Prisma — atomic, không dùng riêng AccountRepositoryPort/ProfileRepositoryPort ở đây. */
  execute(data: {
    loginType: TLoginType;
    identifier: string;
    passwordHash: string;
    profileType: TProfileType;
    address: RegisterAddressInput;
  }): Promise<RegisterAccountTransactionResult>;
}

export const REGISTER_ACCOUNT_TRANSACTION = Symbol(
  'REGISTER_ACCOUNT_TRANSACTION',
);
