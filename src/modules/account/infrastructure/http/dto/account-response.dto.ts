import { TLoginType } from '../../../domain/value-objects/login-type';

export class AccountResponseDto {
  id: string;
  loginType: TLoginType;
  identifier: string;
  displayName: string | null;
  avatarUrl: string | null;
  trustScore: number;
  createdAt: Date;
}
