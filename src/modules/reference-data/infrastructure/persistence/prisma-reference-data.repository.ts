import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ReferenceDataRepositoryPort } from '../../application/ports/reference-data.repository.port';
import { ProvinceView } from '../../application/dto/province-view.dto';
import { WardView } from '../../application/dto/ward-view.dto';
import { SyncReferenceDataInput } from '../../application/dto/sync-reference-data-input.dto';

@Injectable()
export class PrismaReferenceDataRepository implements ReferenceDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findAllProvinces(): Promise<ProvinceView[]> {
    return this.prisma.province.findMany({
      select: { codename: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  findWardsByProvinceCodename(provinceCodename: string): Promise<WardView[]> {
    return this.prisma.ward.findMany({
      where: { provinceCodename },
      select: { codename: true, name: true, provinceCodename: true },
      orderBy: { name: 'asc' },
    });
  }

  async replaceAll(input: SyncReferenceDataInput): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.ward.deleteMany(),
      this.prisma.province.deleteMany(),
      this.prisma.province.createMany({ data: input.provinces }),
      this.prisma.ward.createMany({ data: input.wards }),
    ]);
  }
}
