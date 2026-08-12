import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';

import { ACCOUNT_REPOSITORY } from './application/ports/account.repository.port';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { AccountController } from './infrastructure/http/account.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AccountController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    GetAccountUseCase,
    ChangePasswordUseCase,
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountModule {}
