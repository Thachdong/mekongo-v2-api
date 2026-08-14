import { Injectable } from '@nestjs/common';
import { FindActiveProfileUseCase } from './application/use-cases/find-active-profile.use-case';

import type { ProfileView } from './application/dto/profile-view.dto';
export type { ProfileView } from './application/dto/profile-view.dto';

@Injectable()
export class ProfileFacade {
  constructor(
    private readonly findActiveProfileUseCase: FindActiveProfileUseCase,
  ) {}

  findActive(accountId: string): Promise<ProfileView | null> {
    return this.findActiveProfileUseCase.execute(accountId);
  }
}
