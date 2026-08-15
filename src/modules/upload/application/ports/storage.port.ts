export interface UploadUrlResult {
  uploadUrl: string;
  expiresAt: Date;
}

export interface StoragePort {
  generateUploadUrl(key: string, contentType: string): Promise<UploadUrlResult>;
  /** Move object sang key mới rồi set public-read, trả về public URL cố định. */
  moveObject(fromKey: string, toKey: string): Promise<string>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
