export type TProfileType = 'INDIVIDUAL';

export class Profile {
  constructor(
    readonly id: string,
    readonly accountId: string,
    readonly type: TProfileType,
    private displayName: string | null,
    private avatarUrl: string | null,
    readonly trustScore: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  getDisplayName(): string | null {
    return this.displayName;
  }

  getAvatarUrl(): string | null {
    return this.avatarUrl;
  }

  rename(displayName: string): void {
    this.displayName = displayName;
  }
}
