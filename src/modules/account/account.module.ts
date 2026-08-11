import { Module } from '@nestjs/common';

import { ACCOUNT_REPOSITORY } from './application/ports/account.repository.port';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case';
import { AccountController } from './infrastructure/http/account.controller';

@Module({
  controllers: [AccountController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    GetAccountUseCase,
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountModule {}
