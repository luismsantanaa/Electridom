import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';

export interface LogContext {
  requestId?: string;
  userId?: string;
  module?: string;
  method?: string;
  file?: string;
  line?: number;
  correlationId?: string;
  [key: string]: any;
}

export interface LogData {
  message: string;
  context?: LogContext;
  data?: any;
  error?: Error;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly config: any;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('logger');
    this.logger = this.createPinoLogger();
  }

  private createPinoLogger(): pino.Logger {
    if (!this.config || !this.config.pino) {
      // Configuración por defecto si no hay configuración
      return pino({
        level: 'info',
        transport: process.env.NODE_ENV === 'development' ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        } : undefined,
      });
    }
    
    const pinoConfig = this.config.pino;
    
    return pino({
      level: pinoConfig.level,
      transport: pinoConfig.transport,
      formatters: pinoConfig.formatters,
      serializers: pinoConfig.serializers,
      // Configuración de archivos si está habilitado
      ...(pinoConfig.file && pinoConfig.file.enabled && {
        streams: [
          { stream: pino.destination(pinoConfig.file.path) },
          { stream: process.stdout }
        ]
      })
    });
  }

  private formatLog(level: string, data: LogData): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: data.message,
      ...data.context,
      ...(data.data && { data: data.data }),
      ...(data.error && { 
        error: {
          name: data.error.name,
          message: data.error.message,
          stack: data.error.stack,
          code: (data.error as any).code,
          statusCode: (data.error as any).statusCode,
        }
      })
    };

    switch (level) {
      case 'error':
        this.logger.error(logEntry);
        break;
      case 'warn':
        this.logger.warn(logEntry);
        break;
      case 'info':
        this.logger.info(logEntry);
        break;
      case 'debug':
        this.logger.debug(logEntry);
        break;
      default:
        this.logger.info(logEntry);
    }
  }

  log(message: string, context?: LogContext, data?: any): void {
    this.formatLog('info', { message, context, data });
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const error = trace ? new Error(trace) : undefined;
    this.formatLog('error', { 
      message, 
      context, 
      error,
      data: { trace }
    });
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.formatLog('warn', { message, context, data });
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.formatLog('debug', { message, context, data });
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.formatLog('info', { message, context, data });
  }

  verbose(message: string, context?: LogContext, data?: any): void {
    this.formatLog('debug', { message, context, data });
  }

  // Métodos especializados para diferentes tipos de logs
  logRequest(requestId: string, method: string, url: string, context?: LogContext): void {
    this.log('Incoming request', {
      ...context,
      requestId,
      method,
      url,
      type: 'request'
    });
  }

  logResponse(requestId: string, method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.log('Request completed', {
      ...context,
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      type: 'response'
    });
  }

  logError(requestId: string, method: string, url: string, error: Error, context?: LogContext): void {
    this.error('Request failed', error.stack, {
      ...context,
      requestId,
      method,
      url,
      type: 'error'
    });
  }

  logSecurity(userId: string, action: string, ip: string, context?: LogContext): void {
    this.warn('Security event', {
      ...context,
      userId,
      action,
      ip,
      type: 'security'
    });
  }

  logDatabase(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug('Database operation', {
      ...context,
      operation,
      table,
      duration: `${duration}ms`,
      type: 'database'
    });
  }

  logAI(provider: string, model: string, duration: number, tokens: number, context?: LogContext): void {
    this.info('AI operation completed', {
      ...context,
      provider,
      model,
      duration: `${duration}ms`,
      tokens,
      type: 'ai'
    });
  }
}
