export interface ProfileView {
  id: string;
}

export interface ProfileProviderPort {
  findActiveByAccountId(accountId: string): Promise<ProfileView | null>;
}

export const PROFILE_PROVIDER = Symbol('PROFILE_PROVIDER');
