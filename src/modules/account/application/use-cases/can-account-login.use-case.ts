import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';

@Injectable()
export class CanAccountLoginUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);
    return account !== null && account.isLoginAllowed();
  }
}
