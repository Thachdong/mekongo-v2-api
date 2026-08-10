export interface RefreshTokenRecord {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface RefreshTokenRepositoryPort {
  create(data: {
    accountId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord>;

  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

  revoke(id: string): Promise<void>;

  revokeAllForAccount(accountId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
