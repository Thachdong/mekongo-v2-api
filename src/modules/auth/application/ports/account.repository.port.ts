import { Account } from '../../domain/account.entity';
import { TLoginType } from '../../domain/value-objects/identifier.vo';

export interface AccountRepositoryPort {
  findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<Account | null>;

  findById(id: string): Promise<Account | null>;

  create(data: {
    loginType: TLoginType;
    identifier: string;
    passwordHash: string;
  }): Promise<Account>;

  save(account: Account): Promise<void>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
