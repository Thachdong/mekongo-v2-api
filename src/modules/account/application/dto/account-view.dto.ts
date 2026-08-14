import { Account } from '../../domain/account.entity';

export interface AccountView {
  id: string;
  phone: string | null;
  email: string | null;
}

export function toAccountView(account: Account): AccountView {
  return { id: account.id, phone: account.phone, email: account.email };
}
