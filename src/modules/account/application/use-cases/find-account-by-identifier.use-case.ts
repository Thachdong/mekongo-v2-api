import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { TLoginType } from '../../domain/value-objects/login-type';
import { AccountView, toAccountView } from '../dto/account-view.dto';

@Injectable()
export class FindAccountByIdentifierUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(
    loginType: TLoginType,
    identifier: string,
  ): Promise<AccountView | null> {
    const account = await this.accountRepository.findByIdentifier(
      loginType,
      identifier,
    );
    return account ? toAccountView(account) : null;
  }
}
