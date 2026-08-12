import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_LOOKUP,
  AccountLookupPort,
} from '../ports/account-lookup.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import {
  REGISTER_ACCOUNT_TRANSACTION,
  RegisterAccountTransactionPort,
  RegisterAddressInput,
} from '../ports/register-account-transaction.port';
import {
  Identifier,
  TLoginType,
} from '../../domain/value-objects/identifier.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { TProfileType } from '@modules/profile/public-api';
import { IdentifierTakenError } from '../../domain/errors/auth-domain.errors';
import { RequestOtpUseCase } from './request-otp.use-case';

export interface RegisterAccountInput {
  loginType: TLoginType;
  identifier: string;
  password: string;
  profileType?: TProfileType;
  address: RegisterAddressInput;
}

export interface RegisterAccountResult {
  accountId: string;
  profileId: string;
  otpRequestId: string;
}

@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(ACCOUNT_LOOKUP)
    private readonly accountLookup: AccountLookupPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(REGISTER_ACCOUNT_TRANSACTION)
    private readonly registerTransaction: RegisterAccountTransactionPort,
    private readonly requestOtpUseCase: RequestOtpUseCase,
  ) {}

  async execute(input: RegisterAccountInput): Promise<RegisterAccountResult> {
    const identifier = Identifier.create(input.loginType, input.identifier);
    const password = Password.create(input.password);

    const exists = await this.accountLookup.existsByIdentifier(
      identifier.loginType,
      identifier.value,
    );
    if (exists) {
      throw new IdentifierTakenError();
    }

    const passwordHash = await this.passwordHasher.hash(password.value);

    const { accountId, profileId } = await this.registerTransaction.execute({
      loginType: identifier.loginType,
      identifier: identifier.value,
      passwordHash,
      profileType: input.profileType ?? 'INDIVIDUAL',
      address: input.address,
    });

    const { otpRequestId } = await this.requestOtpUseCase.execute({
      purpose: 'REGISTER',
      accountId,
    });

    return { accountId, profileId, otpRequestId };
  }
}
