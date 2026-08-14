import { Injectable } from '@nestjs/common';
import { ProfileFacade } from '@modules/profile/public-api';
import {
  ProfileProviderPort,
  ProfileView,
} from '../../application/ports/profile-provider.port';

@Injectable()
export class ProfileProviderAdapter implements ProfileProviderPort {
  constructor(private readonly profileFacade: ProfileFacade) {}

  findActiveByAccountId(accountId: string): Promise<ProfileView | null> {
    return this.profileFacade.findActive(accountId);
  }
}
