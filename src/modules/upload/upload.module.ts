import { Module } from '@nestjs/common';

import { STORAGE_SERVICE } from './application/ports/storage.port';
import { FirebaseStorageAdapter } from './infrastructure/adapters/firebase-storage.adapter';
import { RequestUploadUrlUseCase } from './application/use-cases/request-upload-url.use-case';
import { UploadController } from './infrastructure/http/upload.controller';
import { UploadFacade } from './upload.facade';

@Module({
  controllers: [UploadController],
  providers: [
    { provide: STORAGE_SERVICE, useClass: FirebaseStorageAdapter },
    RequestUploadUrlUseCase,
    UploadFacade,
  ],
  exports: [UploadFacade],
})
export class UploadModule {}
