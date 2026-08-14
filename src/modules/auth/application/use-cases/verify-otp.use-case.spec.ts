import { ConfigType } from '@nestjs/config';
import { otpConfig } from '@configs/otp.config';
import { VerifyOtpUseCase } from './verify-otp.use-case';
import { OtpRequestRepositoryPort } from '../ports/otp-request.repository.port';
import { AccountProviderPort } from '../ports/account-provider.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { TokenServicePort } from '../ports/token.service.port';
import { OtpRequest, TOtpPurpose } from '../../domain/otp-request.entity';
import {
  OtpNotFoundError,
  OtpWrongCodeError,
} from '../../domain/errors/auth-domain.errors';

function makeOtpRequest(
  purpose: TOtpPurpose,
  accountId: string | null = 'account-1',
): OtpRequest {
  // VerifyOtpUseCase tự gọi `new Date()` thật (không inject clock) — expiresAt
  // phải tính tương đối theo giờ hệ thống lúc chạy test, không hardcode mốc quá khứ.
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
  return new OtpRequest(
    'otp-1',
    purpose,
    accountId,
    '0912345678',
    createdAt,
    'code-hash',
    0,
    1,
    null,
    null,
    expiresAt,
    null,
    null,
  );
}

const config: ConfigType<typeof otpConfig> = {
  codeLength: 6,
  ttlMinutes: 5,
  maxResendAttempts: 5,
  resendBlockHours: 5,
  maxWrongAttempts: 5,
  wrongBlockHours: 5,
  resetTokenTtlMinutes: 10,
};

describe('VerifyOtpUseCase', () => {
  let otpRequestRepository: jest.Mocked<OtpRequestRepositoryPort>;
  let accountProvider: jest.Mocked<AccountProviderPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let useCase: VerifyOtpUseCase;

  beforeEach(() => {
    otpRequestRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findLatestActive: jest.fn(),
      findByResetTokenHash: jest.fn(),
      save: jest.fn(),
    };
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

    useCase = new VerifyOtpUseCase(
      otpRequestRepository,
      accountProvider,
      passwordHasher,
      tokenService,
      config,
    );
  });

  const input = { otpRequestId: 'otp-1', code: '123456' };

  it('throw OtpNotFoundError nếu otpRequestId không tồn tại', async () => {
    otpRequestRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(OtpNotFoundError);
  });

  it('sai code — tăng wrongAttempts, save, throw OtpWrongCodeError kèm remaining', async () => {
    const otp = makeOtpRequest('REGISTER');
    otpRequestRepository.findById.mockResolvedValue(otp);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(OtpWrongCodeError);
    expect(otpRequestRepository.save).toHaveBeenCalledWith(otp);
    expect(otp.getWrongAttempts()).toBe(1);
  });

  it('đúng code, purpose REGISTER — activate account, không trả resetToken', async () => {
    const otp = makeOtpRequest('REGISTER');
    otpRequestRepository.findById.mockResolvedValue(otp);
    passwordHasher.compare.mockResolvedValue(true);
    accountProvider.activate.mockResolvedValue('OK');

    const result = await useCase.execute(input);

    expect(result.resetToken).toBeUndefined();
    expect(accountProvider.activate).toHaveBeenCalledWith(otp.accountId);
    expect(otp.isConsumed()).toBe(true);
  });

  it('đúng code, purpose RESET_PASSWORD — trả resetToken, gắn vào otpRequest', async () => {
    const otp = makeOtpRequest('RESET_PASSWORD');
    otpRequestRepository.findById.mockResolvedValue(otp);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.generateOpaqueToken.mockReturnValue('reset-token-plain');
    tokenService.hashOpaqueToken.mockReturnValue('reset-token-hash');

    const result = await useCase.execute(input);

    expect(result.resetToken).toBe('reset-token-plain');
    expect(otp.matchesResetToken('reset-token-hash')).toBe(true);
    expect(accountProvider.activate).not.toHaveBeenCalled();
  });
});
