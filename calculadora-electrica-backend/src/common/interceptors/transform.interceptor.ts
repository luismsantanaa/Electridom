import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResultDto } from '../dtos/result.dto';
import { PaginatedResultDto } from '../dtos/paginated-result.dto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Si la respuesta ya es un ResultDto o PaginatedResultDto, la devolvemos tal cual
        if (data instanceof ResultDto || data instanceof PaginatedResultDto) {
          return data;
        }

        // Si la respuesta tiene metadata de paginación, usamos PaginatedResultDto
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data?.meta) {
          return PaginatedResultDto.success(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            data.data,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            Number(data.meta?.totalItems ?? 0),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            data.meta,
          );
        }

        // Para cualquier otra respuesta, usamos ResultDto
        return ResultDto.success(data);
      }),
    );
  }
}
