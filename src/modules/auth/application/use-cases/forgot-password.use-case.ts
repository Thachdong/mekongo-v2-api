import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '@modules/account/application/ports/account.repository.port';
import {
  Identifier,
  TLoginType,
} from '../../domain/value-objects/identifier.vo';
import { RequestOtpUseCase } from './request-otp.use-case';

export interface ForgotPasswordInput {
  loginType: TLoginType;
  identifier: string;
}

export interface ForgotPasswordResult {
  otpRequestId: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    private readonly requestOtpUseCase: RequestOtpUseCase,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    const identifier = Identifier.create(input.loginType, input.identifier);

    const account = await this.accountRepository.findByIdentifier(
      identifier.loginType,
      identifier.value,
    );

    if (!account) {
      // Không tồn tại vẫn trả otpRequestId giả — tránh lộ thông tin identifier nào đã đăng ký (account enumeration).
      return { otpRequestId: randomUUID() };
    }

    const result = await this.requestOtpUseCase.execute({
      purpose: 'RESET_PASSWORD',
      accountId: account.id,
    });

    return { otpRequestId: result.otpRequestId };
  }
}
