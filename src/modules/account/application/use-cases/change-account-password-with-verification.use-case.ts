import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { ChangePasswordResult } from '../dto/change-password-result.dto';

@Injectable()
export class ChangeAccountPasswordWithVerificationUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(
    accountId: string,
    oldPlainPassword: string,
    newPlainPassword: string,
  ): Promise<ChangePasswordResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) return 'ACCOUNT_NOT_FOUND';

    const isMatch = await this.passwordHasher.compare(
      oldPlainPassword,
      account.getPasswordHash(),
    );
    if (!isMatch) return 'WRONG_OLD_PASSWORD';

    const passwordHash = await this.passwordHasher.hash(newPlainPassword);
    account.changePassword(passwordHash);
    await this.accountRepository.save(account);
    return 'OK';
  }
}
