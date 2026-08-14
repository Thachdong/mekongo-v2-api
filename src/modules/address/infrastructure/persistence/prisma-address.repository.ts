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

  findById(id: string): Promise<AddressView | null> {
    return this.prisma.address.findUnique({ where: { id } });
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

  async setDefault(accountId: string, addressId: string): Promise<AddressView> {
    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { accountId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  async delete(addressId: string): Promise<void> {
    await this.prisma.address.delete({ where: { id: addressId } });
  }
}
