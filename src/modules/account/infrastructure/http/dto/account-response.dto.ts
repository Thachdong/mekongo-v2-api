import { TLoginType } from '../../../domain/value-objects/login-type';

export class AccountResponseDto {
  id: string;
  loginType: TLoginType;
  identifier: string;
  createdAt: Date;
}
