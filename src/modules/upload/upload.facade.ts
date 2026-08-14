import { Injectable, Inject } from '@nestjs/common';

import { STORAGE_SERVICE, StoragePort } from './application/ports/storage.port';
import { TMP_PREFIX, USER_PREFIX } from './domain/upload-policy';

@Injectable()
export class UploadFacade {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StoragePort) {}

  /**
   * Move file từ tmp/{fileName} sang user/{accountId}/{...destSegments}/{fileName},
   * set public-read, trả public URL cố định. `key` chỉ cần chứa fileName (basename) —
   * lấy nguyên basename, bỏ mọi path client gửi kèm.
   */
  async finalize(
    accountId: string,
    key: string,
    destSegments: string[] = [],
  ): Promise<string> {
    const fileName = key.split('/').pop();
    const fromKey = `${TMP_PREFIX}/${fileName}`;
    const destKey = [USER_PREFIX, accountId, ...destSegments, fileName].join(
      '/',
    );

    return this.storage.moveObject(fromKey, destKey);
  }
}
