import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '@configs/jwt.config';

export interface AuthenticatedUser {
  accountId: string;
  profileId: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.accessSecret,
    });
  }

  validate(payload: { sub: string; profileId: string }): AuthenticatedUser {
    return { accountId: payload.sub, profileId: payload.profileId };
  }
}
