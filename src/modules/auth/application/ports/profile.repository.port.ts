import { Profile } from '../../domain/profile.entity';

export interface ProfileRepositoryPort {
  findSoleByAccountId(accountId: string): Promise<Profile | null>;
}

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
