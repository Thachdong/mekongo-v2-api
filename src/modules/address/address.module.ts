import { Module } from '@nestjs/common';

import { ADDRESS_REPOSITORY } from './application/ports/address.repository.port';
import { PrismaAddressRepository } from './infrastructure/persistence/prisma-address.repository';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case';
import { ListAddressesUseCase } from './application/use-cases/list-addresses.use-case';
import { SetDefaultAddressUseCase } from './application/use-cases/set-default-address.use-case';
import { AddressController } from './infrastructure/http/address.controller';

@Module({
  controllers: [AddressController],
  providers: [
    { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
    CreateAddressUseCase,
    ListAddressesUseCase,
    SetDefaultAddressUseCase,
  ],
})
export class AddressModule {}
