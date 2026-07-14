import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';

export const Paginate = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginateQuery => {
    const request = ctx.switchToHttp().getRequest();
    return request.query;
  },
);
