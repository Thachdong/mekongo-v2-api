import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AccountRepositoryPort } from '../../application/ports/account.repository.port';
import { TLoginType } from '../../domain/value-objects/login-type';
import { Account } from '../../domain/account.entity';
import { AccountMapper } from './account.mapper';

@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({
      where:
        loginType === 'phone' ? { phone: identifier } : { email: identifier },
    });
    return row ? AccountMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({ where: { id } });
    return row ? AccountMapper.toDomain(row) : null;
  }

  async save(account: Account): Promise<void> {
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        passwordHash: account.getPasswordHash(),
        status: account.getStatus(),
      },
    });
  }
}
