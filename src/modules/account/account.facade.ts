import { Injectable } from '@nestjs/common';
import { TLoginType } from './domain/value-objects/login-type';
import { AuthenticateAccountUseCase } from './application/use-cases/authenticate-account.use-case';
import { ExistsAccountByIdentifierUseCase } from './application/use-cases/exists-account-by-identifier.use-case';
import { FindAccountByIdentifierUseCase } from './application/use-cases/find-account-by-identifier.use-case';
import { FindAccountByIdUseCase } from './application/use-cases/find-account-by-id.use-case';
import { CanAccountLoginUseCase } from './application/use-cases/can-account-login.use-case';
import { ChangeAccountPasswordUseCase } from './application/use-cases/change-account-password.use-case';
import { ChangeAccountPasswordWithVerificationUseCase } from './application/use-cases/change-account-password-with-verification.use-case';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case';

import type { AccountView } from './application/dto/account-view.dto';
export type { AccountView } from './application/dto/account-view.dto';
import type { ChangePasswordResult } from './application/dto/change-password-result.dto';
export type { ChangePasswordResult } from './application/dto/change-password-result.dto';
import type { AccountActionResult } from './application/dto/account-action-result.dto';
export type { AccountActionResult } from './application/dto/account-action-result.dto';

@Injectable()
export class AccountFacade {
  constructor(
    private readonly authenticateAccountUseCase: AuthenticateAccountUseCase,
    private readonly existsAccountByIdentifierUseCase: ExistsAccountByIdentifierUseCase,
    private readonly findAccountByIdentifierUseCase: FindAccountByIdentifierUseCase,
    private readonly findAccountByIdUseCase: FindAccountByIdUseCase,
    private readonly canAccountLoginUseCase: CanAccountLoginUseCase,
    private readonly changeAccountPasswordUseCase: ChangeAccountPasswordUseCase,
    private readonly changeAccountPasswordWithVerificationUseCase: ChangeAccountPasswordWithVerificationUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
  ) {}

  authenticate(
    loginType: TLoginType,
    identifier: string,
    plainPassword: string,
  ): Promise<AccountView | null> {
    return this.authenticateAccountUseCase.execute(
      loginType,
      identifier,
      plainPassword,
    );
  }

  existsByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<boolean> {
    return this.existsAccountByIdentifierUseCase.execute(loginType, identifier);
  }

  findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<AccountView | null> {
    return this.findAccountByIdentifierUseCase.execute(loginType, identifier);
  }

  findById(id: string): Promise<AccountView | null> {
    return this.findAccountByIdUseCase.execute(id);
  }

  canLogin(accountId: string): Promise<boolean> {
    return this.canAccountLoginUseCase.execute(accountId);
  }

  changePassword(
    accountId: string,
    newPlainPassword: string,
  ): Promise<AccountActionResult> {
    return this.changeAccountPasswordUseCase.execute(
      accountId,
      newPlainPassword,
    );
  }

  changePasswordWithVerification(
    accountId: string,
    oldPlainPassword: string,
    newPlainPassword: string,
  ): Promise<ChangePasswordResult> {
    return this.changeAccountPasswordWithVerificationUseCase.execute(
      accountId,
      oldPlainPassword,
      newPlainPassword,
    );
  }

  activate(accountId: string): Promise<AccountActionResult> {
    return this.activateAccountUseCase.execute(accountId);
  }
}
