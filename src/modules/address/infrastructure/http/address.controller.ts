import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

import { CurrentUser } from '@modules/auth/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/infrastructure/security/jwt-access.strategy';

import { CreateAddressUseCase } from '../../application/use-cases/create-address.use-case';
import { ListAddressesUseCase } from '../../application/use-cases/list-addresses.use-case';

import { CreateAddressDto } from './dto/create-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { AddressResponseMapper } from './mappers/address.response.mapper';

@ApiTags('Address')
@ApiBearerAuth('bearerAuth')
@Controller('addresses')
export class AddressController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly listAddressesUseCase: ListAddressesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current account's addresses" })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AddressResponseDto[]> {
    const addresses = await this.listAddressesUseCase.execute(user.accountId);
    return addresses.map(AddressResponseMapper.toApi);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new address to the current account' })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.createAddressUseCase.execute({
      accountId: user.accountId,
      label: dto.label,
      street: dto.street,
      ward: dto.ward,
      provinceId: dto.provinceId,
      isDefault: dto.isDefault,
    });
    return AddressResponseMapper.toApi(address);
  }
}
