import { ProfileModel } from '@generated/prisma/models';
import { Profile } from '../../domain/profile.entity';

export class ProfileMapper {
  static toDomain(row: ProfileModel): Profile {
    return new Profile(
      row.id,
      row.accountId,
      row.type,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }
}
