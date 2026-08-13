import {
  AccountActionResult,
  ChangePasswordResult,
} from '@modules/account/public-api';

export type TLoginType = 'phone' | 'email';

export interface AccountView {
  id: string;
  phone: string | null;
  email: string | null;
}

export type { AccountActionResult, ChangePasswordResult };

export interface AccountProviderPort {
  authenticate(
    loginType: TLoginType,
    identifier: string,
    plainPassword: string,
  ): Promise<AccountView | null>;
  existsByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<boolean>;
  findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<AccountView | null>;
  findById(id: string): Promise<AccountView | null>;
  canLogin(accountId: string): Promise<boolean>;
  changePassword(
    accountId: string,
    newPlainPassword: string,
  ): Promise<AccountActionResult>;
  changePasswordWithVerification(
    accountId: string,
    oldPlainPassword: string,
    newPlainPassword: string,
  ): Promise<ChangePasswordResult>;
  activate(accountId: string): Promise<AccountActionResult>;
}

export const ACCOUNT_PROVIDER = Symbol('ACCOUNT_PROVIDER');
