import { Account } from '../../domain/account.entity';
import { TLoginType } from '../../domain/value-objects/login-type';

export interface AccountRepositoryPort {
  findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<Account | null>;

  findById(id: string): Promise<Account | null>;

  save(account: Account): Promise<void>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
