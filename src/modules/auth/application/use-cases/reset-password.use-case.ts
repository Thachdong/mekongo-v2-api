import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_PROVIDER,
  AccountProviderPort,
} from '../ports/account-provider.port';
import {
  OTP_REQUEST_REPOSITORY,
  OtpRequestRepositoryPort,
} from '../ports/otp-request.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, TokenServicePort } from '../ports/token.service.port';
import { Password } from '../../domain/value-objects/password.vo';
import {
  AccountNotFoundError,
  InvalidResetTokenError,
} from '../../domain/errors/auth-domain.errors';

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(OTP_REQUEST_REPOSITORY)
    private readonly otpRequestRepository: OtpRequestRepositoryPort,
    @Inject(ACCOUNT_PROVIDER)
    private readonly accountProvider: AccountProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const password = Password.create(input.newPassword);
    const resetTokenHash = this.tokenService.hashOpaqueToken(input.resetToken);

    const otpRequest =
      await this.otpRequestRepository.findByResetTokenHash(resetTokenHash);

    const now = new Date();
    if (
      !otpRequest ||
      otpRequest.purpose !== 'RESET_PASSWORD' ||
      !otpRequest.matchesResetToken(resetTokenHash, now)
    ) {
      throw new InvalidResetTokenError();
    }

    if (!otpRequest.accountId) throw new AccountNotFoundError();

    const result = await this.accountProvider.changePassword(
      otpRequest.accountId,
      password.value,
    );
    if (result === 'ACCOUNT_NOT_FOUND') throw new AccountNotFoundError();

    otpRequest.invalidateResetToken();

    await this.otpRequestRepository.save(otpRequest);
    // Đổi mật khẩu xong revoke toàn bộ session — client phải login lại.
    await this.refreshTokenRepository.revokeAllForAccount(otpRequest.accountId);
  }
}
