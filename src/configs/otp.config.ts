import { registerAs } from '@nestjs/config';

export const otpConfig = registerAs('otp', () => ({
  codeLength: 6,
  ttlMinutes: 5,
  maxResendAttempts: 5,
  resendBlockHours: 5,
  maxWrongAttempts: 5,
  wrongBlockHours: 5,
  resetTokenTtlMinutes: 10,
}));
