import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

import { CurrentUser } from '@modules/auth/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/infrastructure/security/jwt-access.strategy';

import { GetAccountUseCase } from '../../application/use-cases/get-account.use-case';

import { AccountResponseDto } from './dto/account-response.dto';
import { AccountResponseMapper } from './mappers/account.response.mapper';

@ApiTags('Account')
@ApiBearerAuth('bearerAuth')
@Controller('account')
export class AccountController {
  constructor(private readonly getAccountUseCase: GetAccountUseCase) {}

  @Get()
  @ApiOperation({
    summary:
      "Get the current account's login identity (not profile/display info)",
  })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'ACCOUNT_NOT_FOUND — account not found',
  )
  async getAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountResponseDto> {
    const account = await this.getAccountUseCase.execute(user.accountId);
    return AccountResponseMapper.toApi(account);
  }
}
