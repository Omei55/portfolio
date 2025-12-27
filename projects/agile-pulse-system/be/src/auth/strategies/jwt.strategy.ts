import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwt_constants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt_constants.secret,
    });
  }

  async validate(payload: { sub: string; email: string; roles: string[] }) {
    return {
      user_id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
