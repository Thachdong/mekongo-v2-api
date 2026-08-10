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
}
