import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { otpConfig } from '@configs/otp.config';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import {
  OTP_REQUEST_REPOSITORY,
  OtpRequestRepositoryPort,
} from '../ports/otp-request.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { TOKEN_SERVICE, TokenServicePort } from '../ports/token.service.port';
import {
  AccountNotFoundError,
  OtpNotFoundError,
  OtpWrongCodeError,
} from '../../domain/errors/auth-domain.errors';

export interface VerifyOtpInput {
  otpRequestId: string;
  code: string;
}

export interface VerifyOtpResult {
  resetToken?: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(OTP_REQUEST_REPOSITORY)
    private readonly otpRequestRepository: OtpRequestRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    @Inject(otpConfig.KEY)
    private readonly config: ConfigType<typeof otpConfig>,
  ) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const otpRequest = await this.otpRequestRepository.findById(
      input.otpRequestId,
    );
    if (!otpRequest) throw new OtpNotFoundError();

    const now = new Date();
    const isMatch = await this.passwordHasher.compare(
      input.code,
      otpRequest.getCodeHash(),
    );

    if (!isMatch) {
      otpRequest.recordWrongAttempt(
        this.config.maxWrongAttempts,
        this.config.wrongBlockHours,
        now,
      );
      await this.otpRequestRepository.save(otpRequest);
      throw new OtpWrongCodeError(
        otpRequest.getWrongAttemptsRemaining(this.config.maxWrongAttempts),
      );
    }

    otpRequest.consume(now);

    let resetToken: string | undefined;
    if (
      otpRequest.purpose === 'RESET_PASSWORD' ||
      otpRequest.purpose === 'CHANGE_PASSWORD'
    ) {
      resetToken = this.tokenService.generateOpaqueToken();
      const resetTokenHash = this.tokenService.hashOpaqueToken(resetToken);
      otpRequest.attachResetToken(
        resetTokenHash,
        this.config.resetTokenTtlMinutes,
        now,
      );
    }

    await this.otpRequestRepository.save(otpRequest);

    if (otpRequest.purpose === 'REGISTER') {
      if (!otpRequest.accountId) throw new AccountNotFoundError();

      const account = await this.accountRepository.findById(
        otpRequest.accountId,
      );
      if (!account) throw new AccountNotFoundError();

      account.activate();
      await this.accountRepository.save(account);
    }

    return { resetToken };
  }
}
