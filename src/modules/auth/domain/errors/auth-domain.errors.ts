import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/kernel/domain-error';

export class AccountAlreadyActivatedError extends DomainError {
  readonly code = 'ACCOUNT_ALREADY_ACTIVATED';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor() {
    super('Account is already activated');
  }
}

export class PasswordTooShortError extends DomainError {
  readonly code = 'PASSWORD_TOO_SHORT';
  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor(minLength: number) {
    super(`Password must be at least ${minLength} characters`);
  }
}

export class InvalidIdentifierError extends DomainError {
  readonly code = 'INVALID_IDENTIFIER';
  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor(loginType: 'phone' | 'email') {
    super(`Invalid ${loginType} format`);
  }
}

export class OtpExpiredError extends DomainError {
  readonly code = 'OTP_EXPIRED';
  readonly httpStatus = 400;
  constructor() {
    super('OTP has expired');
  }
}

export class OtpAlreadyConsumedError extends DomainError {
  readonly code = 'OTP_ALREADY_CONSUMED';
  readonly httpStatus = 400;
  constructor() {
    super('OTP has already been used');
  }
}

export class OtpBlockedError extends DomainError {
  readonly code = 'OTP_BLOCKED';
  readonly httpStatus = 429;
  constructor(readonly retryAfter: Date) {
    super('Too many attempts, try again later');
  }

  toPayload() {
    return { retryAfter: this.retryAfter.toISOString() };
  }
}

export class OtpNotFoundError extends DomainError {
  readonly code = 'OTP_NOT_FOUND';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor() {
    super('OTP request not found');
  }
}

export class OtpWrongCodeError extends DomainError {
  readonly code = 'OTP_WRONG_CODE';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor(readonly wrongAttemptsRemaining: number) {
    super('Incorrect OTP code');
  }

  toPayload() {
    return { wrongAttemptsRemaining: this.wrongAttemptsRemaining };
  }
}

export class OtpTargetRequiredError extends DomainError {
  readonly code = 'OTP_TARGET_REQUIRED';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor() {
    super('accountId or identifier is required');
  }
}

export class IdentifierTakenError extends DomainError {
  readonly code = 'IDENTIFIER_TAKEN';
  readonly httpStatus = HttpStatus.CONFLICT;
  constructor() {
    super('Identifier is already registered');
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  constructor() {
    super('Invalid identifier or password');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  constructor() {
    super('Refresh token is invalid, expired, or revoked');
  }
}

export class InvalidResetTokenError extends DomainError {
  readonly code = 'INVALID_RESET_TOKEN';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor() {
    super('Reset token is invalid or expired');
  }
}

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;
  constructor() {
    super('Account not found');
  }
}
