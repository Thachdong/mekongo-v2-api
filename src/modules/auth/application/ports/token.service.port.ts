export interface AccessTokenPayload {
  accountId: string;
  profileId: string;
}

export interface IssuedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;

  getAccessTokenTtlSeconds(): number;

  issueRefreshToken(): IssuedRefreshToken;

  hashRefreshToken(token: string): string;

  /** Random token dùng cho resetToken (password reset/change) — TTL do OtpRequest tự tính, không cần TokenServicePort biết. */
  generateOpaqueToken(): string;

  hashOpaqueToken(token: string): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
