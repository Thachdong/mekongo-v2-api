import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_PROVIDER,
  AccountProviderPort,
} from '../ports/account-provider.port';
import {
  PROFILE_PROVIDER,
  ProfileProviderPort,
} from '../ports/profile-provider.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, TokenServicePort } from '../ports/token.service.port';
import {
  AccountNotFoundError,
  InvalidRefreshTokenError,
} from '../../domain/errors/auth-domain.errors';
import { TokenPairResult } from '../dto/token-pair.result';

export interface RefreshTokenInput {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(ACCOUNT_PROVIDER)
    private readonly accountProvider: AccountProviderPort,
    @Inject(PROFILE_PROVIDER)
    private readonly profileProvider: ProfileProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: RefreshTokenInput): Promise<TokenPairResult> {
    const tokenHash = this.tokenService.hashRefreshToken(input.refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    const now = new Date();
    if (!record || record.revokedAt !== null || record.expiresAt < now) {
      throw new InvalidRefreshTokenError();
    }

    const canLogin = await this.accountProvider.canLogin(record.accountId);
    if (!canLogin) {
      throw new InvalidRefreshTokenError();
    }

    const profile = await this.profileProvider.findActiveByAccountId(
      record.accountId,
    );
    if (!profile) throw new AccountNotFoundError();

    // rotation: revoke token cũ trước khi phát token mới, chống replay nếu token bị lộ
    await this.refreshTokenRepository.revoke(record.id);

    const accessToken = await this.tokenService.signAccessToken({
      accountId: record.accountId,
      profileId: profile.id,
    });
    const issued = this.tokenService.issueRefreshToken();

    await this.refreshTokenRepository.create({
      accountId: record.accountId,
      tokenHash: issued.tokenHash,
      expiresAt: issued.expiresAt,
    });

    return {
      accessToken,
      refreshToken: issued.token,
      expiresIn: this.tokenService.getAccessTokenTtlSeconds(),
    };
  }
}
