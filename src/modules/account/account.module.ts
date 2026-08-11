import { Module } from '@nestjs/common';

import { ACCOUNT_REPOSITORY } from './application/ports/account.repository.port';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';

@Module({
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountModule {}
