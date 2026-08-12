import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

import { CurrentUser } from '../security/current-user.decorator';
import { AuthenticatedUser } from '../security/jwt-access.strategy';

import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';

import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Account')
@ApiBearerAuth('bearerAuth')
@Controller('account')
export class AccountPasswordController {
  constructor(private readonly changePasswordUseCase: ChangePasswordUseCase) {}

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Change password while logged in (Profile screen). Requires current password + OTP. ' +
      'On success, all sessions are revoked — client must log in again.',
  })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid; WRONG_OLD_PASSWORD — oldPassword incorrect',
  )
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'INVALID_RESET_TOKEN — resetToken invalid/expired; PASSWORD_TOO_SHORT — newPassword shorter than 8 chars',
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'ACCOUNT_NOT_FOUND — account not found',
  )
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.changePasswordUseCase.execute({
      accountId: user.accountId,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
      resetToken: dto.resetToken,
    });
  }
}
