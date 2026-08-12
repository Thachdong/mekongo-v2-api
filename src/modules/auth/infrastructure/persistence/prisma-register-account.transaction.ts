import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  RegisterAccountTransactionPort,
  RegisterAccountTransactionResult,
  RegisterAddressInput,
} from '../../application/ports/register-account-transaction.port';
import { TLoginType } from '../../domain/value-objects/identifier.vo';
import { TProfileType } from '@modules/profile/public-api';

@Injectable()
export class PrismaRegisterAccountTransaction implements RegisterAccountTransactionPort {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: {
    loginType: TLoginType;
    identifier: string;
    passwordHash: string;
    profileType: TProfileType;
    address: RegisterAddressInput;
  }): Promise<RegisterAccountTransactionResult> {
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
            isActive: true,
          },
        });

        await tx.address.create({
          data: {
            accountId: accountRow.id,
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
      accountId: accountRow.id,
      profileId: profileRow.id,
    };
  }
}
