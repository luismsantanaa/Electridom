import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request as any).traceId || 'unknown';

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
        errors = Array.isArray(responseObj.message) ? responseObj.message : [message];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [exception.message];
    }

    const errorResponse = {
      traceId,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      { traceId, path: request.url },
    );

    response.status(status).json(errorResponse);
  }
}
