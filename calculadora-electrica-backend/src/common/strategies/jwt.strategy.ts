import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../modules/users/users.service';
import { User } from '../../modules/users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        return null;
      }

      if (!user.active || user.estado !== 'activo') {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error en JwtStrategy.validate:', error);
      return null;
    }
  }
}
