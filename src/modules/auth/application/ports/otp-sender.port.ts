import { TLoginType } from '../../domain/value-objects/identifier.vo';

export interface OtpSenderPort {
  send(loginType: TLoginType, identifier: string, code: string): Promise<void>;
}

export const OTP_SENDER = Symbol('OTP_SENDER');
