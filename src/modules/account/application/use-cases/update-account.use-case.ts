import { Inject, Injectable } from '@nestjs/common';

import { UploadFacade } from '@modules/upload/upload.facade';

import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { Account } from '../../domain/account.entity';
import { AccountNotFoundError } from '../../domain/errors/account-domain.errors';

export interface UpdateAccountInput {
  displayName?: string;
  avatarKey?: string;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    private readonly uploadFacade: UploadFacade,
  ) {}

  async execute(
    accountId: string,
    input: UpdateAccountInput,
  ): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new AccountNotFoundError();

    if (input.displayName !== undefined) account.rename(input.displayName);
    if (input.avatarKey !== undefined) {
      const avatarUrl = await this.uploadFacade.finalize(
        accountId,
        input.avatarKey,
      );
      account.setAvatarUrl(avatarUrl);
    }

    await this.accountRepository.save(account);
    return account;
  }
}
