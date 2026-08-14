import { Inject, Injectable } from '@nestjs/common';

import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { Account } from '../../domain/account.entity';
import { AccountNotFoundError } from '../../domain/errors/account-domain.errors';

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new AccountNotFoundError();

    return account;
  }
}
