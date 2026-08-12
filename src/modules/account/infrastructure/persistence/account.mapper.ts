import { AccountModel } from '@generated/prisma/models';
import { Account } from '../../domain/account.entity';

export class AccountMapper {
  static toDomain(row: AccountModel): Account {
    return new Account(
      row.id,
      row.phone,
      row.email,
      row.passwordHash,
      row.status,
      row.displayName,
      row.avatarUrl,
      row.trustScore,
      row.createdAt,
      row.updatedAt,
    );
  }
}
