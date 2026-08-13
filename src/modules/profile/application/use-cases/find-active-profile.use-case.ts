import { Inject, Injectable } from '@nestjs/common';
import {
  PROFILE_REPOSITORY,
  ProfileRepositoryPort,
} from '../ports/profile.repository.port';
import { ProfileView } from '../dto/profile-view.dto';

@Injectable()
export class FindActiveProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<ProfileView | null> {
    const profile =
      await this.profileRepository.findActiveByAccountId(accountId);
    return profile ? { id: profile.id } : null;
  }
}
