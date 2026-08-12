export type TProfileType = 'INDIVIDUAL';

export class Profile {
  constructor(
    readonly id: string,
    readonly accountId: string,
    readonly type: TProfileType,
    private _isActive: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }
}
