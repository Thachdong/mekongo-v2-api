import { LoginUseCase } from './login.use-case';
import {
  AccountProviderPort,
  AccountView,
} from '../ports/account-provider.port';
import {
  ProfileProviderPort,
  ProfileView,
} from '../ports/profile-provider.port';
import { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import { TokenServicePort } from '../ports/token.service.port';
import {
  AccountNotFoundError,
  InvalidCredentialsError,
} from '../../domain/errors/auth-domain.errors';

function makeAccount(): AccountView {
  return { id: 'account-1', phone: '0912345678', email: null };
}

function makeProfile(): ProfileView {
  return { id: 'profile-1' };
}

describe('LoginUseCase', () => {
  let accountProvider: jest.Mocked<AccountProviderPort>;
  let profileProvider: jest.Mocked<ProfileProviderPort>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepositoryPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    accountProvider = {
      authenticate: jest.fn(),
      existsByIdentifier: jest.fn(),
      findByIdentifier: jest.fn(),
      findById: jest.fn(),
      canLogin: jest.fn(),
      changePasswordWithVerification: jest.fn(),
      changePassword: jest.fn(),
      activate: jest.fn(),
    };
    profileProvider = {
      findActiveByAccountId: jest.fn(),
    };
    refreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForAccount: jest.fn(),
    };
    tokenService = {
      signAccessToken: jest.fn(),
      getAccessTokenTtlSeconds: jest.fn(),
      issueRefreshToken: jest.fn(),
      hashRefreshToken: jest.fn(),
      generateOpaqueToken: jest.fn(),
      hashOpaqueToken: jest.fn(),
    };

    useCase = new LoginUseCase(
      accountProvider,
      profileProvider,
      refreshTokenRepository,
      tokenService,
    );
  });

  const input = {
    loginType: 'phone' as const,
    identifier: '0912345678',
    password: 'password123',
  };

  it('throw InvalidCredentialsError nếu authenticate trả null (không tìm thấy / không được phép login / sai mật khẩu)', async () => {
    accountProvider.authenticate.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(accountProvider.authenticate).toHaveBeenCalledWith(
      'phone',
      '0912345678',
      'password123',
    );
  });

  it('throw AccountNotFoundError nếu authenticate thành công nhưng thiếu profile (bất thường)', async () => {
    accountProvider.authenticate.mockResolvedValue(makeAccount());
    profileProvider.findActiveByAccountId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(AccountNotFoundError);
  });

  it('trả TokenPair + tạo refresh token khi thành công', async () => {
    accountProvider.authenticate.mockResolvedValue(makeAccount());
    profileProvider.findActiveByAccountId.mockResolvedValue(makeProfile());
    tokenService.signAccessToken.mockResolvedValue('access-token');
    tokenService.issueRefreshToken.mockReturnValue({
      token: 'refresh-plain',
      tokenHash: 'refresh-hash',
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    tokenService.getAccessTokenTtlSeconds.mockReturnValue(900);

    const result = await useCase.execute(input);

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-plain',
      expiresIn: 900,
    });
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      accountId: 'account-1',
      profileId: 'profile-1',
    });
    expect(refreshTokenRepository.create).toHaveBeenCalledWith({
      accountId: 'account-1',
      tokenHash: 'refresh-hash',
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    });
  });
});
