import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '@modules/account/application/ports/account.repository.port';
import {
  PROFILE_REPOSITORY,
  ProfileRepositoryPort,
} from '@modules/profile/application/ports/profile.repository.port';
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
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
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

    const account = await this.accountRepository.findById(record.accountId);
    if (!account || !account.isLoginAllowed()) {
      throw new InvalidRefreshTokenError();
    }

    const profile = await this.profileRepository.findSoleByAccountId(
      account.id,
    );
    if (!profile) throw new AccountNotFoundError();

    // rotation: revoke token cũ trước khi phát token mới, chống replay nếu token bị lộ
    await this.refreshTokenRepository.revoke(record.id);

    const accessToken = await this.tokenService.signAccessToken({
      accountId: account.id,
      profileId: profile.id,
    });
    const issued = this.tokenService.issueRefreshToken();

    await this.refreshTokenRepository.create({
      accountId: account.id,
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
