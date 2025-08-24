import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = request.user;
    if (!user) {
      throw new Error('Usuario no encontrado en la solicitud');
    }
    return user;
  },
);
