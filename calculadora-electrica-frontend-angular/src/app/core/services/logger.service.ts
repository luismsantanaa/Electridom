import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface LogContext {
  component?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogData {
  message: string;
  context?: LogContext;
  data?: any;
  error?: Error;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;
  private readonly enableLogging = environment.enableLogging;
  private readonly enableDebug = environment.enableDebug;

  private logToConsole(level: LogLevel, data: LogData): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: data.message,
      ...data.context,
      ...(data.data && { data: data.data }),
      ...(data.error && {
        error: {
          name: data.error.name,
          message: data.error.message,
          stack: this.isProduction ? undefined : data.error.stack
        }
      })
    };

    switch (level) {
      case LogLevel.ERROR:
        console.error(`[${timestamp}] ERROR:`, logEntry);
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] WARN:`, logEntry);
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] INFO:`, logEntry);
        break;
      case LogLevel.DEBUG:
        if (this.enableDebug) {
          console.debug(`[${timestamp}] DEBUG:`, logEntry);
        }
        break;
    }

    // En producción, enviar logs críticos al backend
    if (this.isProduction && level === LogLevel.ERROR) {
      this.sendLogToBackend(logEntry);
    }
  }

  private async sendLogToBackend(logEntry: any): Promise<void> {
    try {
      // Enviar log crítico al backend para análisis
      await fetch(`${environment.apiUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Silenciar errores de logging para evitar loops infinitos
      console.warn('Failed to send log to backend:', error);
    }
  }

  // Métodos principales de logging
  error(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.ERROR, { message, context, data });
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.WARN, { message, context, data });
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.INFO, { message, context, data });
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.DEBUG, { message, context, data });
  }

  // Métodos especializados para diferentes tipos de logs
  logError(error: Error, context?: LogContext, data?: any): void {
    this.error(`Application Error: ${error.message}`, context, { ...data, error });
  }

  logHttpError(status: number, message: string, context?: LogContext, data?: any): void {
    this.error(`HTTP Error ${status}: ${message}`, context, { ...data, status });
  }

  logValidationError(field: string, message: string, context?: LogContext, data?: any): void {
    this.warn(`Validation Error in ${field}: ${message}`, context, { ...data, field });
  }

  logUserAction(action: string, userId: string, context?: LogContext, data?: any): void {
    this.info(`User Action: ${action}`, { ...context, userId, action: 'user_action' }, data);
  }

  logApiCall(method: string, url: string, duration: number, context?: LogContext, data?: any): void {
    this.debug(`API Call: ${method} ${url}`, context, { ...data, method, url, duration: `${duration}ms` });
  }

  logComponentLifecycle(component: string, lifecycle: string, context?: LogContext, data?: any): void {
    this.debug(`Component ${lifecycle}: ${component}`, { ...context, component, lifecycle }, data);
  }

  logPerformance(operation: string, duration: number, context?: LogContext, data?: any): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, context, { ...data, operation, duration });
  }

  // Método para logging de errores de formularios
  logFormError(formName: string, errors: any, context?: LogContext): void {
    this.warn(`Form Validation Errors in ${formName}`, context, { formName, errors });
  }

  // Método para logging de errores de exportación
  logExportError(format: string, error: Error, context?: LogContext): void {
    this.error(`Export Error (${format}): ${error.message}`, context, { format, error });
  }

  // Método para logging de errores de IA
  logAIError(provider: string, error: Error, context?: LogContext): void {
    this.error(`AI Error (${provider}): ${error.message}`, context, { provider, error });
  }

  // Método para logging de métricas
  logMetric(name: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Metric: ${name} = ${value} ${unit}`, context, { metric: name, value, unit });
  }
}
