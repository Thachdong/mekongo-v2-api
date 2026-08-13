import { Module } from '@nestjs/common';

import { ACCOUNT_REPOSITORY } from './application/ports/account.repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account.use-case';
import { AuthenticateAccountUseCase } from './application/use-cases/authenticate-account.use-case';
import { ExistsAccountByIdentifierUseCase } from './application/use-cases/exists-account-by-identifier.use-case';
import { FindAccountByIdentifierUseCase } from './application/use-cases/find-account-by-identifier.use-case';
import { FindAccountByIdUseCase } from './application/use-cases/find-account-by-id.use-case';
import { CanAccountLoginUseCase } from './application/use-cases/can-account-login.use-case';
import { ChangeAccountPasswordUseCase } from './application/use-cases/change-account-password.use-case';
import { ChangeAccountPasswordWithVerificationUseCase } from './application/use-cases/change-account-password-with-verification.use-case';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case';
import { AccountController } from './infrastructure/http/account.controller';
import { AccountFacade } from './account.facade';

@Module({
  controllers: [AccountController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    GetAccountUseCase,
    UpdateAccountUseCase,
    AuthenticateAccountUseCase,
    ExistsAccountByIdentifierUseCase,
    FindAccountByIdentifierUseCase,
    FindAccountByIdUseCase,
    CanAccountLoginUseCase,
    ChangeAccountPasswordUseCase,
    ChangeAccountPasswordWithVerificationUseCase,
    ActivateAccountUseCase,
    AccountFacade,
  ],
  exports: [AccountFacade],
})
export class AccountModule {}
