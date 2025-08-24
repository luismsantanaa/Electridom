import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ErrorResponse,
  DatabaseError,
  HttpErrorResponse,
  ErrorResponseProduction,
} from '../interfaces/error.interface';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private getErrorLocation(error: Error): {
    file?: string;
    method?: string;
    line?: number;
    stack?: string;
  } {
    const stack = error.stack || '';
    const stackLines = stack.split('\n');

    // Buscar la primera línea del stack que no sea del interceptor
    const relevantLine = stackLines.find(
      (line) =>
        line.includes('at ') &&
        !line.includes('ErrorInterceptor') &&
        !line.includes('node_modules'),
    );

    if (relevantLine) {
      const match = relevantLine.match(
        /at\s+(?:(?:(?:Object\.)?[^\(]+)?\s*\(?)?([^:]+):(\d+):(\d+)/,
      );
      if (match) {
        return {
          file: match[1].trim(),
          line: parseInt(match[2], 10),
          stack: stack,
        };
      }
    }

    return {
      stack: stack,
    };
  }

  private createErrorResponse(
    errorCode: string,
    message: string,
    details: any,
    request: any,
    location: { file?: string; method?: string; line?: number; stack?: string },
    isProduction: boolean,
  ): ErrorResponse | ErrorResponseProduction {
    const baseError = {
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    if (isProduction) {
      return baseError as ErrorResponseProduction;
    }

    return {
      ...baseError,
      error: {
        ...baseError.error,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        path: request.url,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        method: request.method,
        file: location.file,
        line: location.line,
        stack: location.stack,
      },
    } as ErrorResponse;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isProduction = process.env.NODE_ENV === 'production';

    return next.handle().pipe(
      catchError((error) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let details = null;
        const location = this.getErrorLocation(error);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const request = context.switchToHttp().getRequest();

        if (error instanceof HttpException) {
          status = error.getStatus();
          const response = error.getResponse() as HttpErrorResponse;

          if (typeof response === 'object') {
            message = response.message || error.message;
            errorCode = response.error || 'HTTP_EXCEPTION';
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            details = response.details || null;
          } else {
            message = error.message;
            errorCode = 'HTTP_EXCEPTION';
          }
        } else {
          // Para errores no HTTP (como errores de base de datos)
          const dbError = error as DatabaseError;
          message = dbError.message || 'Error interno del servidor';
          errorCode = dbError.code || 'INTERNAL_SERVER_ERROR';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details = dbError.details || null;
        }

        const errorResponse = this.createErrorResponse(
          errorCode,
          message,
          details,
          request,
          location,
          isProduction,
        );

        return throwError(() => new HttpException(errorResponse, status));
      }),
    );
  }
}
