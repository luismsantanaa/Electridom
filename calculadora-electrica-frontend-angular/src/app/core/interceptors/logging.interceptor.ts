import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Log del request
    this.logger.debug(`HTTP Request: ${request.method} ${request.url}`, {
      component: 'LoggingInterceptor',
      method: 'intercept',
      requestId,
      url: request.url,
      method: request.method,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body)
    });

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event.type === 4) {
          // HttpResponse
          const response = event as any;
          const duration = Date.now() - startTime;

          this.logger.debug(`HTTP Response: ${response.status} ${request.method} ${request.url}`, {
            component: 'LoggingInterceptor',
            method: 'intercept',
            requestId,
            url: request.url,
            method: request.method,
            status: response.status,
            duration
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;

        // Log del error HTTP
        this.logger.logHttpError(
          error.status,
          error.message,
          {
            component: 'LoggingInterceptor',
            method: 'intercept',
            requestId,
            url: request.url,
            method: request.method,
            duration
          },
          {
            error: error.error,
            headers: error.headers,
            statusText: error.statusText
          }
        );

        return throwError(() => error);
      })
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];

    headers.keys().forEach((key) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = headers.get(key);
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'refreshToken'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
