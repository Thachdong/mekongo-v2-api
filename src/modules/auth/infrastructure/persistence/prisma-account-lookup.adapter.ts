import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AccountLookupPort } from '../../application/ports/account-lookup.port';
import { TLoginType } from '../../domain/value-objects/identifier.vo';

@Injectable()
export class PrismaAccountLookupAdapter implements AccountLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async existsByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<boolean> {
    const where =
      loginType === 'phone' ? { phone: identifier } : { email: identifier };
    const count = await this.prisma.account.count({ where });
    return count > 0;
  }
}
