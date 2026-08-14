import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { AccountActionResult } from '../dto/account-action-result.dto';

@Injectable()
export class ChangeAccountPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(
    accountId: string,
    newPlainPassword: string,
  ): Promise<AccountActionResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) return 'ACCOUNT_NOT_FOUND';

    const passwordHash = await this.passwordHasher.hash(newPlainPassword);
    account.changePassword(passwordHash);
    await this.accountRepository.save(account);
    return 'OK';
  }
}
