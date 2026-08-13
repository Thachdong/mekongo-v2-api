import { Inject, Injectable } from '@nestjs/common';

import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { Account } from '../../domain/account.entity';
import { AccountNotFoundError } from '../../domain/errors/account-domain.errors';

export interface UpdateAccountInput {
  displayName?: string;
  avatarUrl?: string;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(
    accountId: string,
    input: UpdateAccountInput,
  ): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new AccountNotFoundError();

    if (input.displayName !== undefined) account.rename(input.displayName);
    if (input.avatarUrl !== undefined) account.setAvatarUrl(input.avatarUrl);

    await this.accountRepository.save(account);
    return account;
  }
}
