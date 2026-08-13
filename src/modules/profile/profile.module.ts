import { Module } from '@nestjs/common';

import { PROFILE_REPOSITORY } from './application/ports/profile.repository.port';
import { PrismaProfileRepository } from './infrastructure/persistence/prisma-profile.repository';
import { FindActiveProfileUseCase } from './application/use-cases/find-active-profile.use-case';
import { ProfileFacade } from './profile.facade';

@Module({
  providers: [
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    FindActiveProfileUseCase,
    ProfileFacade,
  ],
  exports: [ProfileFacade],
})
export class ProfileModule {}
