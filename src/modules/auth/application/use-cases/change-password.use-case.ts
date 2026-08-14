import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_PROVIDER,
  AccountProviderPort,
} from '../ports/account-provider.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
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
    @Inject(ACCOUNT_PROVIDER)
    private readonly accountProvider: AccountProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const newPassword = Password.create(input.newPassword);

    const result = await this.accountProvider.changePasswordWithVerification(
      input.accountId,
      input.oldPassword,
      newPassword.value,
    );
    if (result === 'ACCOUNT_NOT_FOUND') throw new AccountNotFoundError();
    if (result === 'WRONG_OLD_PASSWORD') throw new WrongOldPasswordError();

    // Đổi mật khẩu xong revoke toàn bộ session — client phải login lại.
    await this.refreshTokenRepository.revokeAllForAccount(input.accountId);
  }
}
