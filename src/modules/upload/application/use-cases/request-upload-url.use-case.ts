import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { STORAGE_SERVICE, StoragePort } from '../ports/storage.port';
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE_BYTES,
  TMP_PREFIX,
} from '../../domain/upload-policy';
import {
  FileSizeExceededError,
  UnsupportedContentTypeError,
} from '../../domain/errors/upload-domain.errors';

export interface RequestUploadUrlInput {
  fileName: string;
  contentType: string;
  size: number;
}

export interface RequestUploadUrlOutput {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

@Injectable()
export class RequestUploadUrlUseCase {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StoragePort) {}

  async execute(input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput> {
    if (!ALLOWED_CONTENT_TYPES.includes(input.contentType)) {
      throw new UnsupportedContentTypeError(input.contentType);
    }
    if (input.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeExceededError(MAX_FILE_SIZE_BYTES);
    }

    const key = `${TMP_PREFIX}/${randomUUID()}-${sanitizeFileName(input.fileName)}`;

    const { uploadUrl, expiresAt } = await this.storage.generateUploadUrl(
      key,
      input.contentType,
    );

    return { uploadUrl, key, expiresAt };
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
