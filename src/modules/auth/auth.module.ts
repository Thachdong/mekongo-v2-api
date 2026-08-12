import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccountModule } from '@modules/account/account.module';
import { ProfileModule } from '@modules/profile/profile.module';

import { OTP_REQUEST_REPOSITORY } from './application/ports/otp-request.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository.port';
import { REGISTER_ACCOUNT_TRANSACTION } from './application/ports/register-account-transaction.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token.service.port';
import { OTP_SENDER } from './application/ports/otp-sender.port';

import { PrismaOtpRequestRepository } from './infrastructure/persistence/prisma-otp-request.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { PrismaRegisterAccountTransaction } from './infrastructure/persistence/prisma-register-account.transaction';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { JwtAccessStrategy } from './infrastructure/security/jwt-access.strategy';
import { ConsoleOtpSender } from './infrastructure/otp/console-otp-sender';

import { RegisterAccountUseCase } from './application/use-cases/register-account.use-case';
import { RequestOtpUseCase } from './application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';

import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    forwardRef(() => AccountModule),
    ProfileModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: OTP_REQUEST_REPOSITORY, useClass: PrismaOtpRequestRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: REGISTER_ACCOUNT_TRANSACTION,
      useClass: PrismaRegisterAccountTransaction,
    },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: OTP_SENDER, useClass: ConsoleOtpSender },
    JwtAccessStrategy,

    RegisterAccountUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  // account/password/change (module khác) cần dùng lại (hash/verify mật khẩu, revoke refresh token) —
  // export sẵn để account module tái dùng thay vì tự cài đặt lại. Account/Profile giờ đã là chủ sở
  // hữu domain của chính nó (xem AccountModule/ProfileModule) — Auth chỉ còn export service hỗ trợ.
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY, OTP_REQUEST_REPOSITORY],
})
export class AuthModule {}
