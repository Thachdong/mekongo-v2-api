import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../ports/account.repository.port';
import { TLoginType } from '../../domain/value-objects/login-type';

@Injectable()
export class ExistsAccountByIdentifierUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(loginType: TLoginType, identifier: string): Promise<boolean> {
    const account = await this.accountRepository.findByIdentifier(
      loginType,
      identifier,
    );
    return account !== null;
  }
}
