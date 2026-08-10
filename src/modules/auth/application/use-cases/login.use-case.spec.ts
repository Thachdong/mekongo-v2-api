import { LoginUseCase } from './login.use-case';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ProfileRepositoryPort } from '../ports/profile.repository.port';
import { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { TokenServicePort } from '../ports/token.service.port';
import { Account } from '../../domain/account.entity';
import { Profile } from '../../domain/profile.entity';
import {
  AccountNotFoundError,
  InvalidCredentialsError,
} from '../../domain/errors/auth-domain.errors';

function makeAccount(
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BLOCKED' = 'ACTIVE',
): Account {
  return new Account(
    'account-1',
    '0912345678',
    null,
    'hashed-password',
    status,
    new Date(),
    new Date(),
  );
}

function makeProfile(): Profile {
  return new Profile(
    'profile-1',
    'account-1',
    'INDIVIDUAL',
    null,
    null,
    0,
    new Date(),
    new Date(),
  );
}

describe('LoginUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let profileRepository: jest.Mocked<ProfileRepositoryPort>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    accountRepository = {
      findByIdentifier: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    profileRepository = {
      findSoleByAccountId: jest.fn(),
    };
    refreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForAccount: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
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
      accountRepository,
      profileRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService,
    );
  });

  const input = {
    loginType: 'phone' as const,
    identifier: '0912345678',
    password: 'password123',
  };

  it('throw InvalidCredentialsError nếu không tìm thấy account', async () => {
    accountRepository.findByIdentifier.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('throw InvalidCredentialsError nếu account không ACTIVE', async () => {
    accountRepository.findByIdentifier.mockResolvedValue(
      makeAccount('PENDING_VERIFICATION'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('throw InvalidCredentialsError nếu sai mật khẩu', async () => {
    accountRepository.findByIdentifier.mockResolvedValue(makeAccount());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('throw AccountNotFoundError nếu account ACTIVE nhưng thiếu profile (bất thường)', async () => {
    accountRepository.findByIdentifier.mockResolvedValue(makeAccount());
    passwordHasher.compare.mockResolvedValue(true);
    profileRepository.findSoleByAccountId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(AccountNotFoundError);
  });

  it('trả TokenPair + tạo refresh token khi thành công', async () => {
    accountRepository.findByIdentifier.mockResolvedValue(makeAccount());
    passwordHasher.compare.mockResolvedValue(true);
    profileRepository.findSoleByAccountId.mockResolvedValue(makeProfile());
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
