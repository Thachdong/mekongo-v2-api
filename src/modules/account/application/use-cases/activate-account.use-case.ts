import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { AccountActionResult } from '../dto/account-action-result.dto';

@Injectable()
export class ActivateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<AccountActionResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) return 'ACCOUNT_NOT_FOUND';

    account.activate();
    await this.accountRepository.save(account);
    return 'OK';
  }
}
