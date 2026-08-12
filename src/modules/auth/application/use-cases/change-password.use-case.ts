import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '@modules/account/application/ports/account.repository.port';
import {
  OTP_REQUEST_REPOSITORY,
  OtpRequestRepositoryPort,
} from '../ports/otp-request.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { TOKEN_SERVICE, TokenServicePort } from '../ports/token.service.port';
import { Password } from '../../domain/value-objects/password.vo';
import {
  AccountNotFoundError,
  InvalidResetTokenError,
  WrongOldPasswordError,
} from '../../domain/errors/auth-domain.errors';

export interface ChangePasswordInput {
  accountId: string;
  oldPassword: string;
  newPassword: string;
  resetToken: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(OTP_REQUEST_REPOSITORY)
    private readonly otpRequestRepository: OtpRequestRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const newPassword = Password.create(input.newPassword);
    const resetTokenHash = this.tokenService.hashOpaqueToken(input.resetToken);

    const otpRequest =
      await this.otpRequestRepository.findByResetTokenHash(resetTokenHash);

    const now = new Date();
    if (
      !otpRequest ||
      otpRequest.purpose !== 'CHANGE_PASSWORD' ||
      otpRequest.accountId !== input.accountId ||
      !otpRequest.matchesResetToken(resetTokenHash, now)
    ) {
      throw new InvalidResetTokenError();
    }

    const account = await this.accountRepository.findById(input.accountId);
    if (!account) throw new AccountNotFoundError();

    const oldPasswordMatches = await this.passwordHasher.compare(
      input.oldPassword,
      account.getPasswordHash(),
    );
    if (!oldPasswordMatches) throw new WrongOldPasswordError();

    const passwordHash = await this.passwordHasher.hash(newPassword.value);
    account.changePassword(passwordHash);
    otpRequest.invalidateResetToken();

    await this.accountRepository.save(account);
    await this.otpRequestRepository.save(otpRequest);
    // Đổi mật khẩu xong revoke toàn bộ session — client phải login lại.
    await this.refreshTokenRepository.revokeAllForAccount(account.id);
  }
}
