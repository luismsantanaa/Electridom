import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: any): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch {
      return false;
    }
  }
}
