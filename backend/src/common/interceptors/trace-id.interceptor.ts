import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const traceId = uuidv4();

    // Add traceId to request
    request.traceId = traceId;

    // Add traceId to response headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Trace-Id', traceId);

    return next.handle().pipe(
      tap((data) => {
        // Add traceId to response data if it's an object
        if (data && typeof data === 'object' && !data.traceId) {
          data.traceId = traceId;
        }
      }),
    );
  }
}
