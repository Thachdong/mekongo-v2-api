import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

import {
  AddressRepositoryPort,
  CreateAddressData,
} from '../../application/ports/address.repository.port';
import { AddressView } from '../../application/dto/address-view.dto';

@Injectable()
export class PrismaAddressRepository implements AddressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  countByAccountId(accountId: string): Promise<number> {
    return this.prisma.address.count({ where: { accountId } });
  }

  findManyByAccountId(accountId: string): Promise<AddressView[]> {
    return this.prisma.address.findMany({
      where: { accountId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  async create(data: CreateAddressData): Promise<AddressView> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { accountId: data.accountId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          accountId: data.accountId,
          label: data.label,
          street: data.street,
          ward: data.ward,
          provinceId: data.provinceId,
          isDefault: data.isDefault,
        },
      });
    });
  }
}
