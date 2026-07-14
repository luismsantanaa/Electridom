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
import { AppLoggerService } from '../services/logger.service';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

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
    if (isProduction) {
      return {
        success: false,
        error: {
          code: errorCode,
          message: message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: message,
        details: details,
        timestamp: new Date().toISOString(),
        path: request?.url || 'unknown',
        file: location.file,
        method: location.method,
        line: location.line,
        stack: location.stack,
      },
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isProduction = process.env.NODE_ENV === 'production';
    const request = context.switchToHttp().getRequest();
    const requestId = request?.requestId || 'unknown';

    return next.handle().pipe(
      catchError((error) => {
        // Si es un HttpException, NO lo interceptamos, dejamos que pase
        if (error instanceof HttpException) {
          // Solo log del error para debugging, pero no lo modificamos
          this.logger.warn(`HTTP Exception passed through: ${error.message}`, {
            requestId,
            statusCode: error.getStatus(),
            path: request?.url,
            method: request?.method,
            type: 'http_exception_passed'
          });
          
          // Re-lanzar el error original sin modificación
          return throwError(() => error);
        }

        // Solo interceptamos errores NO HTTP (como errores de base de datos, etc.)
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let details = null;
        const location = this.getErrorLocation(error);

        // Para errores no HTTP (como errores de base de datos)
        const dbError = error as DatabaseError;
        message = dbError.message || 'Error interno del servidor';
        errorCode = dbError.code || 'INTERNAL_SERVER_ERROR';
        details = dbError.details || null;

        // Log del error usando el nuevo servicio
        this.logger.error(`Application Error: ${message}`, error.stack, {
          requestId,
          errorCode,
          statusCode: status,
          path: request?.url,
          method: request?.method,
          ip: request?.ip,
          file: location.file,
          line: location.line,
          type: 'application_error',
        });

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
