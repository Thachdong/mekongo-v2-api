import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ProfileRepositoryPort } from '../../application/ports/profile.repository.port';
import { Profile } from '../../domain/profile.entity';
import { ProfileMapper } from './profile.mapper';

@Injectable()
export class PrismaProfileRepository implements ProfileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findSoleByAccountId(accountId: string): Promise<Profile | null> {
    const row = await this.prisma.profile.findFirst({ where: { accountId } });
    return row ? ProfileMapper.toDomain(row) : null;
  }
}
