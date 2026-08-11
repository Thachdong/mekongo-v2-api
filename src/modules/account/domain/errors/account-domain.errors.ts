import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/kernel/domain-error';

export class AccountAlreadyActivatedError extends DomainError {
  readonly code = 'ACCOUNT_ALREADY_ACTIVATED';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor() {
    super('Account is already activated');
  }
}

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor() {
    super('Account not found');
  }
}
