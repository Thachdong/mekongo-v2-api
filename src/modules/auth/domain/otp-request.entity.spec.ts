import { OtpRequest } from './otp-request.entity';
import {
  OtpAlreadyConsumedError,
  OtpBlockedError,
  OtpExpiredError,
} from './errors/auth-domain.errors';

function makeOtpRequest(
  overrides: {
    wrongAttempts?: number;
    blockedUntil?: Date | null;
    expiresAt?: Date;
    consumedAt?: Date | null;
  } = {},
): OtpRequest {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return new OtpRequest(
    'otp-1',
    'REGISTER',
    'account-1',
    '0912345678',
    now,
    'hashed-code',
    overrides.wrongAttempts ?? 0,
    1,
    overrides.consumedAt ?? null,
    overrides.blockedUntil ?? null,
    overrides.expiresAt ?? new Date('2026-01-01T00:05:00.000Z'),
    null,
    null,
  );
}

describe('OtpRequest', () => {
  const now = new Date('2026-01-01T00:02:00.000Z');

  describe('isExpired', () => {
    it('false khi chưa tới expiresAt', () => {
      const otp = makeOtpRequest({
        expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      });
      expect(otp.isExpired(now)).toBe(false);
    });

    it('true khi đã qua expiresAt', () => {
      const otp = makeOtpRequest({
        expiresAt: new Date('2026-01-01T00:01:00.000Z'),
      });
      expect(otp.isExpired(now)).toBe(true);
    });
  });

  describe('recordWrongAttempt', () => {
    it('tăng wrongAttempts, chưa block nếu chưa chạm max', () => {
      const otp = makeOtpRequest({ wrongAttempts: 2 });
      otp.recordWrongAttempt(5, 5, now);

      expect(otp.getWrongAttempts()).toBe(3);
      expect(otp.isBlocked(now)).toBe(false);
    });

    it('block khi chạm max, blockedUntil = now + blockHours', () => {
      const otp = makeOtpRequest({ wrongAttempts: 4 });
      otp.recordWrongAttempt(5, 5, now);

      expect(otp.getWrongAttempts()).toBe(5);
      expect(otp.isBlocked(now)).toBe(true);
      expect(otp.getBlockedUntil()).toEqual(
        new Date(now.getTime() + 5 * 60 * 60 * 1000),
      );
    });

    it('throw OtpBlockedError nếu đã blocked từ trước', () => {
      const blockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
      const otp = makeOtpRequest({ wrongAttempts: 5, blockedUntil });

      expect(() => otp.recordWrongAttempt(5, 5, now)).toThrow(OtpBlockedError);
    });

    it('throw OtpExpiredError nếu đã hết hạn', () => {
      const otp = makeOtpRequest({
        expiresAt: new Date('2026-01-01T00:01:00.000Z'),
      });

      expect(() => otp.recordWrongAttempt(5, 5, now)).toThrow(OtpExpiredError);
    });
  });

  describe('getWrongAttemptsRemaining', () => {
    it('trả về số lượt còn lại, không âm', () => {
      const otp = makeOtpRequest({ wrongAttempts: 5 });
      expect(otp.getWrongAttemptsRemaining(5)).toBe(0);
    });
  });

  describe('consume', () => {
    it('set consumedAt khi hợp lệ', () => {
      const otp = makeOtpRequest();
      otp.consume(now);

      expect(otp.isConsumed()).toBe(true);
      expect(otp.getConsumedAt()).toEqual(now);
    });

    it('throw OtpAlreadyConsumedError nếu consume 2 lần', () => {
      const otp = makeOtpRequest();
      otp.consume(now);

      expect(() => otp.consume(now)).toThrow(OtpAlreadyConsumedError);
    });

    it('throw OtpBlockedError nếu đang blocked', () => {
      const blockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
      const otp = makeOtpRequest({ blockedUntil });

      expect(() => otp.consume(now)).toThrow(OtpBlockedError);
    });

    it('throw OtpExpiredError nếu đã hết hạn', () => {
      const otp = makeOtpRequest({
        expiresAt: new Date('2026-01-01T00:01:00.000Z'),
      });

      expect(() => otp.consume(now)).toThrow(OtpExpiredError);
    });
  });

  describe('reset token', () => {
    it('attachResetToken rồi matchesResetToken đúng trong TTL', () => {
      const otp = makeOtpRequest();
      otp.attachResetToken('hash-abc', 10, now);

      expect(otp.matchesResetToken('hash-abc', now)).toBe(true);
      expect(otp.getResetTokenExpiresAt()).toEqual(
        new Date(now.getTime() + 10 * 60 * 1000),
      );
    });

    it('matchesResetToken false khi hash không khớp', () => {
      const otp = makeOtpRequest();
      otp.attachResetToken('hash-abc', 10, now);

      expect(otp.matchesResetToken('wrong-hash', now)).toBe(false);
    });

    it('matchesResetToken false khi hết TTL', () => {
      const otp = makeOtpRequest();
      otp.attachResetToken('hash-abc', 10, now);

      const afterTtl = new Date(now.getTime() + 11 * 60 * 1000);
      expect(otp.matchesResetToken('hash-abc', afterTtl)).toBe(false);
    });

    it('invalidateResetToken xoá hash — matchesResetToken false sau đó', () => {
      const otp = makeOtpRequest();
      otp.attachResetToken('hash-abc', 10, now);
      otp.invalidateResetToken();

      expect(otp.matchesResetToken('hash-abc', now)).toBe(false);
    });
  });
});
