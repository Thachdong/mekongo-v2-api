import { Profile, TProfileType } from '../../domain/profile.entity';

export interface ProfileRepositoryPort {
  create(data: { accountId: string; type: TProfileType }): Promise<Profile>;

  findSoleByAccountId(accountId: string): Promise<Profile | null>;
}

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
