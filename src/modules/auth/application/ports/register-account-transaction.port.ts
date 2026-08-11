import { Account } from '@modules/account/domain/account.entity';
import { Profile, TProfileType } from '@modules/profile/domain/profile.entity';
import { TLoginType } from '../../domain/value-objects/identifier.vo';

export interface RegisterAddressInput {
  label?: string;
  street: string;
  ward: string;
  district: string;
  provinceId: string;
  isDefault?: boolean;
}

export interface RegisterAccountTransactionPort {
  /** Tạo Account + Profile + Address trong 1 transaction Prisma — atomic, không dùng riêng AccountRepositoryPort/ProfileRepositoryPort ở đây. */
  execute(data: {
    loginType: TLoginType;
    identifier: string;
    passwordHash: string;
    profileType: TProfileType;
    address: RegisterAddressInput;
  }): Promise<{ account: Account; profile: Profile }>;
}

export const REGISTER_ACCOUNT_TRANSACTION = Symbol(
  'REGISTER_ACCOUNT_TRANSACTION',
);
