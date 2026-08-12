import { TLoginType } from '../../domain/value-objects/identifier.vo';

export interface AccountLookupPort {
  existsByIdentifier(
    loginType: TLoginType,
    identifier: string,
  ): Promise<boolean>;
}

export const ACCOUNT_LOOKUP = Symbol('ACCOUNT_LOOKUP');
