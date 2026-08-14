import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { AccountView, toAccountView } from '../dto/account-view.dto';

@Injectable()
export class FindAccountByIdUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<AccountView | null> {
    const account = await this.accountRepository.findById(id);
    return account ? toAccountView(account) : null;
  }
}
