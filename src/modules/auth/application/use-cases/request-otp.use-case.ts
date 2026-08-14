import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomInt } from 'crypto';
import { otpConfig } from '@configs/otp.config';
import {
  ACCOUNT_PROVIDER,
  AccountProviderPort,
} from '../ports/account-provider.port';
import {
  OTP_REQUEST_REPOSITORY,
  OtpRequestRepositoryPort,
} from '../ports/otp-request.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { OTP_SENDER, OtpSenderPort } from '../ports/otp-sender.port';
import { TOtpPurpose } from '../../domain/otp-request.entity';
import { TLoginType } from '../../domain/value-objects/identifier.vo';
import {
  AccountNotFoundError,
  OtpBlockedError,
  OtpTargetRequiredError,
} from '../../domain/errors/auth-domain.errors';

export interface RequestOtpInput {
  purpose: TOtpPurpose;
  /** Đã biết account (register vừa tạo xong, hoặc forgot-password đã resolve) — ưu tiên dùng, tự suy loginType/identifier từ Account. */
  accountId?: string;
  /** Dùng khi CHƯA có accountId (client gọi thẳng /auth/otp/request để resend, chỉ có identifier — spec không có field loginType ở endpoint này, suy đoán qua định dạng khi thiếu). */
  identifier?: string;
  loginType?: TLoginType;
}

export interface RequestOtpResult {
  otpRequestId: string;
  expiresAt: Date;
  resendAttemptsRemaining: number;
}

@Injectable()
export class RequestOtpUseCase {
  constructor(
    @Inject(ACCOUNT_PROVIDER)
    private readonly accountProvider: AccountProviderPort,
    @Inject(OTP_REQUEST_REPOSITORY)
    private readonly otpRequestRepository: OtpRequestRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(OTP_SENDER)
    private readonly otpSender: OtpSenderPort,
    @Inject(otpConfig.KEY)
    private readonly config: ConfigType<typeof otpConfig>,
  ) {}

  async execute(input: RequestOtpInput): Promise<RequestOtpResult> {
    const now = new Date();
    const target = await this.resolveTarget(input);

    const latest = await this.otpRequestRepository.findLatestActive({
      purpose: input.purpose,
      accountId: target.accountId ?? undefined,
      identifier: target.identifier,
    });

    if (latest && latest.isBlocked(now)) {
      throw new OtpBlockedError(latest.getBlockedUntil()!);
    }

    const cycleReset =
      !latest || (latest.getBlockedUntil() !== null && !latest.isBlocked(now));
    const nextResendAttempts = cycleReset ? 1 : latest!.getResendAttempts() + 1;

    const isOverLimit = nextResendAttempts > this.config.maxResendAttempts;
    const blockedUntil = isOverLimit
      ? new Date(now.getTime() + this.config.resendBlockHours * 60 * 60 * 1000)
      : null;

    const code = this.generateCode();
    const codeHash = await this.passwordHasher.hash(code);
    const expiresAt = new Date(
      now.getTime() + this.config.ttlMinutes * 60 * 1000,
    );

    const created = await this.otpRequestRepository.create({
      purpose: input.purpose,
      accountId: target.accountId,
      identifier: target.identifier,
      codeHash,
      resendAttempts: nextResendAttempts,
      expiresAt,
      blockedUntil,
    });

    if (isOverLimit) {
      throw new OtpBlockedError(blockedUntil!);
    }

    await this.otpSender.send(target.loginType, target.identifier, code);

    return {
      otpRequestId: created.id,
      expiresAt,
      resendAttemptsRemaining: Math.max(
        0,
        this.config.maxResendAttempts - nextResendAttempts,
      ),
    };
  }

  private async resolveTarget(input: RequestOtpInput): Promise<{
    accountId: string | null;
    loginType: TLoginType;
    identifier: string;
  }> {
    if (input.accountId) {
      const account = await this.accountProvider.findById(input.accountId);
      if (!account) throw new AccountNotFoundError();

      const loginType: TLoginType = account.phone ? 'phone' : 'email';
      const identifier = (account.phone ?? account.email) as string;
      return { accountId: account.id, loginType, identifier };
    }

    if (input.identifier) {
      const loginType: TLoginType =
        input.loginType ?? (input.identifier.includes('@') ? 'email' : 'phone');
      const account = await this.accountProvider.findByIdentifier(
        loginType,
        input.identifier,
      );
      return {
        accountId: account?.id ?? null,
        loginType,
        identifier: input.identifier,
      };
    }

    throw new OtpTargetRequiredError();
  }

  private generateCode(): string {
    const max = 10 ** this.config.codeLength;
    return randomInt(0, max).toString().padStart(this.config.codeLength, '0');
  }
}
