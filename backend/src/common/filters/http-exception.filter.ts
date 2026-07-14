import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../services/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request as any).traceId || 'unknown';
    const requestId = (request as any).requestId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errors = Array.isArray(responseObj.message)
          ? responseObj.message
          : [message];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [exception.message];
    }

    const errorResponse = {
      traceId,
      requestId,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log del error usando el nuevo servicio
    this.logger.error(
      `HTTP Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        traceId,
        requestId,
        path: request.url,
        statusCode: status,
        method: request.method,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        type: 'http_exception'
      }
    );

    response.status(status).json(errorResponse);
  }
}
