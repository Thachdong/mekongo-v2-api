import { Module } from '@nestjs/common';

import { PROFILE_REPOSITORY } from './application/ports/profile.repository.port';
import { PrismaProfileRepository } from './infrastructure/persistence/prisma-profile.repository';

@Module({
  providers: [
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
  ],
  exports: [PROFILE_REPOSITORY],
})
export class ProfileModule {}
