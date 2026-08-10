import {
  OtpExpiredError,
  OtpBlockedError,
  OtpAlreadyConsumedError,
} from './errors/auth-domain.errors';

export type TOtpPurpose = 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_PASSWORD';

export class OtpRequest {
  constructor(
    readonly id: string,
    readonly purpose: TOtpPurpose,
    readonly accountId: string | null,
    readonly identifier: string | null,
    readonly createdAt: Date,
    private readonly _codeHash: string,
    private _wrongAttempts: number,
    private _resendAttempts: number,
    private _consumedAt: Date | null,
    private _blockedUntil: Date | null,
    private readonly _expiresAt: Date,
    private _resetTokenHash: string | null,
    private _resetTokenExpiresAt: Date | null,
  ) {}

  getCodeHash(): string {
    return this._codeHash;
  }

  getResendAttempts(): number {
    return this._resendAttempts;
  }

  isExpired(now = new Date()): boolean {
    return now > this._expiresAt;
  }

  isConsumed(): boolean {
    return this._consumedAt !== null;
  }

  isBlocked(now = new Date()): boolean {
    return this._blockedUntil !== null && now < this._blockedUntil;
  }

  getBlockedUntil(): Date | null {
    return this._blockedUntil;
  }

  recordWrongAttempt(
    maxWrongAttempts: number,
    blockHours: number,
    now = new Date(),
  ): void {
    if (this.isBlocked(now)) throw new OtpBlockedError(this._blockedUntil!);
    if (this.isExpired(now)) throw new OtpExpiredError();

    this._wrongAttempts += 1;
    if (this._wrongAttempts >= maxWrongAttempts) {
      this._blockedUntil = new Date(
        now.getTime() + blockHours * 60 * 60 * 1000,
      );
    }
  }

  getWrongAttemptsRemaining(maxWrongAttempts: number): number {
    return Math.max(0, maxWrongAttempts - this._wrongAttempts);
  }

  consume(now = new Date()): void {
    if (this.isConsumed()) throw new OtpAlreadyConsumedError();
    if (this.isBlocked(now)) throw new OtpBlockedError(this._blockedUntil!);
    if (this.isExpired(now)) throw new OtpExpiredError();

    this._consumedAt = now;
  }

  attachResetToken(
    resetTokenHash: string,
    ttlMinutes: number,
    now = new Date(),
  ): void {
    this._resetTokenHash = resetTokenHash;
    this._resetTokenExpiresAt = new Date(
      now.getTime() + ttlMinutes * 60 * 1000,
    );
  }

  matchesResetToken(candidateHash: string, now = new Date()): boolean {
    return (
      this._resetTokenHash === candidateHash &&
      this._resetTokenExpiresAt !== null &&
      now < this._resetTokenExpiresAt
    );
  }
}
