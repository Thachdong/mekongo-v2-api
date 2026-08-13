import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/kernel/domain-error';

export class AddressNotFoundError extends DomainError {
  readonly code = 'ADDRESS_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor() {
    super('Address not found');
  }
}
