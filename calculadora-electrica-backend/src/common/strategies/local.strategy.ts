import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../modules/auth/services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(
      email,
      password,
      'unknown', // ip
      'unknown', // userAgent
      'unknown', // traceId
    );
    
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
