import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  RegisterAccountTransactionPort,
  RegisterAddressInput,
} from '../../application/ports/register-account-transaction.port';
import { Account } from '@modules/account/domain/account.entity';
import { Profile, TProfileType } from '@modules/profile/domain/profile.entity';
import { TLoginType } from '../../domain/value-objects/identifier.vo';
import { AccountMapper } from '@modules/account/infrastructure/persistence/account.mapper';
import { ProfileMapper } from '@modules/profile/infrastructure/persistence/profile.mapper';

@Injectable()
export class PrismaRegisterAccountTransaction implements RegisterAccountTransactionPort {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: {
    loginType: TLoginType;
    identifier: string;
    passwordHash: string;
    profileType: TProfileType;
    address: RegisterAddressInput;
  }): Promise<{ account: Account; profile: Profile }> {
    const { accountRow, profileRow } = await this.prisma.$transaction(
      async (tx) => {
        const accountRow = await tx.account.create({
          data: {
            phone: data.loginType === 'phone' ? data.identifier : null,
            email: data.loginType === 'email' ? data.identifier : null,
            passwordHash: data.passwordHash,
            status: 'PENDING_VERIFICATION',
          },
        });

        const profileRow = await tx.profile.create({
          data: {
            accountId: accountRow.id,
            type: data.profileType,
          },
        });

        await tx.address.create({
          data: {
            profileId: profileRow.id,
            label: data.address.label,
            street: data.address.street,
            ward: data.address.ward,
            district: data.address.district,
            provinceId: data.address.provinceId,
            isDefault: data.address.isDefault ?? true,
          },
        });

        return { accountRow, profileRow };
      },
    );

    return {
      account: AccountMapper.toDomain(accountRow),
      profile: ProfileMapper.toDomain(profileRow),
    };
  }
}
