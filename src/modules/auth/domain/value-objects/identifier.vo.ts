import { InvalidIdentifierError } from '../errors/auth-domain.errors';

export type TLoginType = 'phone' | 'email';

const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Identifier {
  private constructor(
    readonly loginType: TLoginType,
    readonly value: string,
  ) {}

  static create(loginType: TLoginType, raw: string): Identifier {
    const value = raw.trim();
    const isValid =
      loginType === 'phone'
        ? PHONE_PATTERN.test(value)
        : EMAIL_PATTERN.test(value);

    if (!isValid) {
      throw new InvalidIdentifierError(loginType);
    }

    return new Identifier(loginType, value);
  }
}
