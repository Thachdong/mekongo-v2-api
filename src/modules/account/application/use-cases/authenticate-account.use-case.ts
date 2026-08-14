import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { TLoginType } from '../../domain/value-objects/login-type';
import { AccountView, toAccountView } from '../dto/account-view.dto';

@Injectable()
export class AuthenticateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(
    loginType: TLoginType,
    identifier: string,
    plainPassword: string,
  ): Promise<AccountView | null> {
    const account = await this.accountRepository.findByIdentifier(
      loginType,
      identifier,
    );
    if (!account || !account.isLoginAllowed()) return null;

    const isMatch = await this.passwordHasher.compare(
      plainPassword,
      account.getPasswordHash(),
    );
    if (!isMatch) return null;

    return toAccountView(account);
  }
}
