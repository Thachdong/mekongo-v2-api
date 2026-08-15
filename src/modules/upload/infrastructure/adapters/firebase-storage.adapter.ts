import { Inject, Injectable } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

import { FIREBASE_ADMIN } from '@shared/infrastructure/firebase/firebase-admin.provider';

import {
  StoragePort,
  UploadUrlResult,
} from '../../application/ports/storage.port';
import { UPLOAD_URL_TTL_MS } from '../../domain/upload-policy';

@Injectable()
export class FirebaseStorageAdapter implements StoragePort {
  constructor(@Inject(FIREBASE_ADMIN) private readonly app: App) {}

  private bucket() {
    return getStorage(this.app).bucket();
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
  ): Promise<UploadUrlResult> {
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_MS);
    const [uploadUrl] = await this.bucket().file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType,
    });

    return { uploadUrl, expiresAt };
  }

  async moveObject(fromKey: string, toKey: string): Promise<string> {
    const bucket = this.bucket();
    await bucket.file(fromKey).move(toKey);
    const file = bucket.file(toKey);
    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${toKey}`;
  }
}
