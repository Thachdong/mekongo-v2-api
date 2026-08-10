import { PasswordTooShortError } from '../errors/auth-domain.errors';

const MIN_LENGTH = 8;

export class Password {
  private constructor(readonly value: string) {}

  static create(raw: string): Password {
    if (raw.length < MIN_LENGTH) {
      throw new PasswordTooShortError(MIN_LENGTH);
    }

    return new Password(raw);
  }
}
