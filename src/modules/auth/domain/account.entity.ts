import { AccountAlreadyActivatedError } from './errors/auth-domain.errors';

export type TAccountStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';

export class Account {
  constructor(
    readonly id: string,
    readonly phone: string | null,
    readonly email: string | null,
    private _passwordHash: string,
    private _status: TAccountStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  getPasswordHash(): string {
    return this._passwordHash;
  }

  getStatus(): TAccountStatus {
    return this._status;
  }

  activate(): void {
    if (this._status !== 'PENDING_VERIFICATION') {
      throw new AccountAlreadyActivatedError();
    }

    this._status = 'ACTIVE';
  }

  isLoginAllowed(): boolean {
    return this._status === 'ACTIVE';
  }

  changePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
  }
}
