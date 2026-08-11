import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

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
import { RegisterResponseDto } from './dto/register-response.dto';
import { RequestOtpResponseDto } from './dto/request-otp-response.dto';
import { VerifyOtpResponseDto } from './dto/verify-otp-response.dto';
import { TokenPairResponseDto } from './dto/token-pair-response.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';

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
  @ApiErrorResponse(
    400,
    'PASSWORD_TOO_SHORT — password shorter than 8 chars; INVALID_IDENTIFIER — identifier does not match phone/email format',
  )
  @ApiErrorResponse(409, 'IDENTIFIER_TAKEN — identifier already registered')
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.registerAccountUseCase.execute(dto);
  }

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Request a 6-digit OTP for register / password-reset / password-change',
  })
  @ApiErrorResponse(
    400,
    'OTP_TARGET_REQUIRED — accountId or identifier is required',
  )
  @ApiErrorResponse(404, 'ACCOUNT_NOT_FOUND — accountId does not exist')
  @ApiErrorResponse(
    429,
    'OTP_BLOCKED — too many resend attempts, retry after cooldown',
  )
  requestOtp(@Body() dto: RequestOtpDto): Promise<RequestOtpResponseDto> {
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
  @ApiErrorResponse(
    400,
    'OTP_NOT_FOUND — otpRequestId not found; OTP_WRONG_CODE — incorrect code; OTP_EXPIRED — OTP expired; OTP_ALREADY_CONSUMED — OTP already used',
  )
  @ApiErrorResponse(
    404,
    'ACCOUNT_NOT_FOUND — account not found (REGISTER purpose)',
  )
  @ApiErrorResponse(
    429,
    'OTP_BLOCKED — too many wrong attempts, retry after cooldown',
  )
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.verifyOtpUseCase.execute(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with phone or email' })
  @ApiErrorResponse(
    401,
    'INVALID_CREDENTIALS — wrong identifier/password, or account not allowed to login',
  )
  @ApiErrorResponse(404, 'ACCOUNT_NOT_FOUND — profile missing for account')
  login(@Body() dto: LoginDto): Promise<TokenPairResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiErrorResponse(
    401,
    'INVALID_REFRESH_TOKEN — token invalid, expired, or revoked',
  )
  @ApiErrorResponse(404, 'ACCOUNT_NOT_FOUND — profile missing for account')
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairResponseDto> {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Revoke the current refresh token (e.g. after password change)',
  })
  @ApiErrorResponse(401, 'UNAUTHORIZED — missing or invalid access token')
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
  ): Promise<void> {
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
  @ApiErrorResponse(
    429,
    'OTP_BLOCKED — too many resend attempts, retry after cooldown',
  )
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set a new password after OTP verification (forgot-password flow)',
  })
  @ApiErrorResponse(
    400,
    'INVALID_RESET_TOKEN — reset token invalid/expired; PASSWORD_TOO_SHORT — new password shorter than 8 chars',
  )
  @ApiErrorResponse(404, 'ACCOUNT_NOT_FOUND — account not found')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.resetPasswordUseCase.execute(dto);
  }
}
