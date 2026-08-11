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
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
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
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LoginInput): Promise<TokenPairResult> {
    const identifier = Identifier.create(input.loginType, input.identifier);

    const account = await this.accountRepository.findByIdentifier(
      identifier.loginType,
      identifier.value,
    );
    if (!account || !account.isLoginAllowed()) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await this.passwordHasher.compare(
      input.password,
      account.getPasswordHash(),
    );
    if (!isMatch) {
      throw new InvalidCredentialsError();
    }

    const profile = await this.profileRepository.findSoleByAccountId(
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
