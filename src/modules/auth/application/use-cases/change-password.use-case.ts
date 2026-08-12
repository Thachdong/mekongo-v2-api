import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '@modules/account/application/ports/account.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { Password } from '../../domain/value-objects/password.vo';
import {
  AccountNotFoundError,
  WrongOldPasswordError,
} from '../../domain/errors/auth-domain.errors';

export interface ChangePasswordInput {
  accountId: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const newPassword = Password.create(input.newPassword);

    const account = await this.accountRepository.findById(input.accountId);
    if (!account) throw new AccountNotFoundError();

    const oldPasswordMatches = await this.passwordHasher.compare(
      input.oldPassword,
      account.getPasswordHash(),
    );
    if (!oldPasswordMatches) throw new WrongOldPasswordError();

    const passwordHash = await this.passwordHasher.hash(newPassword.value);
    account.changePassword(passwordHash);

    await this.accountRepository.save(account);
    // Đổi mật khẩu xong revoke toàn bộ session — client phải login lại.
    await this.refreshTokenRepository.revokeAllForAccount(account.id);
  }
}
