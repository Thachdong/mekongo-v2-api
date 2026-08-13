import { Injectable } from '@nestjs/common';
import { AccountFacade } from '@modules/account/public-api';
import {
  AccountActionResult,
  AccountProviderPort,
  AccountView,
  ChangePasswordResult,
  TLoginType,
} from '../../application/ports/account-provider.port';

@Injectable()
export class AccountProviderAdapter implements AccountProviderPort {
  constructor(private readonly accountFacade: AccountFacade) {}

  authenticate(
    loginType: TLoginType,
    identifier: string,
    plainPassword: string,
  ): Promise<AccountView | null> {
    return this.accountFacade.authenticate(
      loginType,
      identifier,
      plainPassword,
    );
  }

  existsByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<boolean> {
    return this.accountFacade.existsByIdentifier(loginType, identifier);
  }

  findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<AccountView | null> {
    return this.accountFacade.findByIdentifier(loginType, identifier);
  }

  findById(id: string): Promise<AccountView | null> {
    return this.accountFacade.findById(id);
  }

  canLogin(accountId: string): Promise<boolean> {
    return this.accountFacade.canLogin(accountId);
  }

  changePassword(
    accountId: string,
    newPlainPassword: string,
  ): Promise<AccountActionResult> {
    return this.accountFacade.changePassword(accountId, newPlainPassword);
  }

  changePasswordWithVerification(
    accountId: string,
    oldPlainPassword: string,
    newPlainPassword: string,
  ): Promise<ChangePasswordResult> {
    return this.accountFacade.changePasswordWithVerification(
      accountId,
      oldPlainPassword,
      newPlainPassword,
    );
  }

  activate(accountId: string): Promise<AccountActionResult> {
    return this.accountFacade.activate(accountId);
  }
}
