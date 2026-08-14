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
  Identifier,
  TLoginType,
} from '../../domain/value-objects/identifier.vo';
import {
  AccountNotFoundError,
  InvalidCredentialsError,
} from '../../domain/errors/auth-domain.errors';
import { TokenPairResult } from '../dto/token-pair.result';

export interface LoginInput {
  loginType: TLoginType;
  identifier: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
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

  async execute(input: LoginInput): Promise<TokenPairResult> {
    const identifier = Identifier.create(input.loginType, input.identifier);

    const account = await this.accountProvider.authenticate(
      identifier.loginType,
      identifier.value,
      input.password,
    );
    if (!account) {
      throw new InvalidCredentialsError();
    }

    const profile = await this.profileProvider.findActiveByAccountId(
      account.id,
    );
    if (!profile) throw new AccountNotFoundError();

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
