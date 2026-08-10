import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { jwtConfig } from '@configs/jwt.config';
import {
  AccessTokenPayload,
  IssuedRefreshToken,
  TokenServicePort,
} from '../../application/ports/token.service.port';

const DURATION_UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }
  return Number(match[1]) * DURATION_UNIT_SECONDS[match[2]];
}

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(
      { sub: payload.accountId, profileId: payload.profileId },
      {
        secret: this.config.accessSecret,
        // jsonwebtoken v9 đòi kiểu literal `${number}${'s'|'m'|'h'|'d'}` cho expiresIn,
        // config đọc từ env chỉ có type string — ép kiểu ở đây, giá trị vẫn validate qua parseDurationToSeconds().
        expiresIn: this.config
          .accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  getAccessTokenTtlSeconds(): number {
    return parseDurationToSeconds(this.config.accessExpiresIn);
  }

  issueRefreshToken(): IssuedRefreshToken {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + parseDurationToSeconds(this.config.refreshExpiresIn) * 1000,
    );
    return { token, tokenHash: this.hashRefreshToken(token), expiresAt };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateOpaqueToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
