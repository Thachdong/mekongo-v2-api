import { Account } from '../../../domain/account.entity';
import { AccountResponseDto } from '../dto/account-response.dto';

export class AccountResponseMapper {
  static toApi(account: Account): AccountResponseDto {
    return {
      id: account.id,
      loginType: account.phone ? 'phone' : 'email',
      identifier: (account.phone ?? account.email)!,
      createdAt: account.createdAt,
    };
  }
}
