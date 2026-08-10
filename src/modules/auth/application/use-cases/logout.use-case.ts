import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TOKEN_SERVICE, TokenServicePort } from '../ports/token.service.port';

export interface LogoutInput {
  accountId: string;
  /** Không có trong openapi.yml request body (spec không show) — giả định: có thì chỉ revoke đúng token đó, không có thì revoke toàn bộ (logout mọi thiết bị). Xem task-plan.md mục 11.1. */
  refreshToken?: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (input.refreshToken) {
      const tokenHash = this.tokenService.hashRefreshToken(input.refreshToken);
      const record =
        await this.refreshTokenRepository.findByTokenHash(tokenHash);

      if (record && record.accountId === input.accountId) {
        await this.refreshTokenRepository.revoke(record.id);
      }
      return;
    }

    await this.refreshTokenRepository.revokeAllForAccount(input.accountId);
  }
}
