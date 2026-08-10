import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../security/public.decorator';
import { CurrentUser } from '../security/current-user.decorator';
import { AuthenticatedUser } from '../security/jwt-access.strategy';

import { RegisterAccountUseCase } from '../../application/use-cases/register-account.use-case';
import { RequestOtpUseCase } from '../../application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';

import { RegisterDto } from './dto/register.dto';
import { OTP_PURPOSE_MAP, RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccountUseCase,
    private readonly requestOtpUseCase: RequestOtpUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new Account + its first Profile (type=INDIVIDUAL)',
  })
  register(@Body() dto: RegisterDto) {
    return this.registerAccountUseCase.execute(dto);
  }

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Request a 6-digit OTP for register / password-reset / password-change',
  })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.requestOtpUseCase.execute({
      purpose: OTP_PURPOSE_MAP[dto.purpose],
      accountId: dto.accountId,
      identifier: dto.identifier,
    });
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify a 6-digit OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyOtpUseCase.execute(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with phone or email' })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke the current refresh token (e.g. after password change)',
  })
  logout(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogoutDto) {
    return this.logoutUseCase.execute({
      accountId: user.accountId,
      refreshToken: dto.refreshToken,
    });
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Start forgot-password flow (not logged in) — triggers OTP request internally',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set a new password after OTP verification (forgot-password flow)',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }
}
