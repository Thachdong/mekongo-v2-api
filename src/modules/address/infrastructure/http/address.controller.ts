import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponse } from '@shared/infrastructure/swagger/api-error-response.decorator';

import { CurrentUser } from '@modules/auth/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/infrastructure/security/jwt-access.strategy';

import { CreateAddressUseCase } from '../../application/use-cases/create-address.use-case';
import { ListAddressesUseCase } from '../../application/use-cases/list-addresses.use-case';
import { SetDefaultAddressUseCase } from '../../application/use-cases/set-default-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';

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
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
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

  @Patch(':id/default')
  @ApiOperation({
    summary: 'Set an address as the default for the current account',
  })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'ADDRESS_NOT_FOUND — address not found or not owned by the current account',
  )
  async setDefault(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AddressResponseDto> {
    const address = await this.setDefaultAddressUseCase.execute(
      user.accountId,
      id,
    );
    return AddressResponseMapper.toApi(address);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete an address from the current account's addresses",
  })
  @ApiErrorResponse(
    HttpStatus.UNAUTHORIZED,
    'UNAUTHORIZED — access token missing, expired, or invalid',
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'ADDRESS_NOT_FOUND — address not found or not owned by the current account',
  )
  @ApiErrorResponse(
    HttpStatus.CONFLICT,
    'CANNOT_DELETE_DEFAULT_ADDRESS — the default address cannot be deleted',
  )
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteAddressUseCase.execute(user.accountId, id);
  }
}
