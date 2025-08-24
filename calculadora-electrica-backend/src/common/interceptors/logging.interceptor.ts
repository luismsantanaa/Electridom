import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const method = request.method;
    const url = request.url;
    const requestId = request['requestId'] || 'unknown';
    const userAgent = request.get('User-Agent') || 'unknown';
    const ip = request.ip || request.connection.remoteAddress || 'unknown';

    // Log del request (sanitizado)
    this.logger.log({
      message: 'Incoming request',
      requestId,
      method,
      url,
      userAgent,
      ip,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const responseSize = this.getResponseSize(data);

          // Log del response (sanitizado)
          this.logger.log({
            message: 'Outgoing response',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            responseSize: `${responseSize} bytes`,
            responseData: this.sanitizeResponse(data),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log del error (sanitizado)
          this.logger.error({
            message: 'Request error',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          });
        },
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveFields = ['authorization', 'cookie', 'x-api-key', 'x-metrics-token'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'refreshToken', 'token', 'secret'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data;

    // Para respuestas grandes, solo mostrar estructura
    if (typeof data === 'object' && Object.keys(data).length > 10) {
      return {
        type: 'object',
        keys: Object.keys(data),
        size: JSON.stringify(data).length,
      };
    }

    return data;
  }

  private getResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
