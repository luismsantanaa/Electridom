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
import { MetricsService } from '../../modules/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extraer información del request
    const method = request.method;
    const route = this.getRoute(request);
    const statusCode = response.statusCode;

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(method, route, statusCode, startTime);
        },
        error: (error) => {
          const errorStatusCode = error.status || 500;
          this.recordMetrics(method, route, errorStatusCode, startTime);
        },
      }),
    );
  }

  private getRoute(request: Request): string {
    // Obtener la ruta base sin parámetros
    const baseUrl = request.baseUrl || '';
    const path = request.route?.path || request.path || '';
    let route = `${baseUrl}${path}`.replace(/\/$/, '') || '/';
    
    // Remover el prefijo /api para consistencia en métricas
    route = route.replace(/^\/api/, '') || '/';
    
    return route;
  }

  private recordMetrics(method: string, route: string, statusCode: number, startTime: number): void {
    try {
      const duration = (Date.now() - startTime) / 1000; // Convertir a segundos

      // Incrementar contador de requests
      this.metricsService.incrementHttpRequests(method, route, statusCode);

      // Observar duración
      this.metricsService.observeHttpRequestDuration(method, route, statusCode, duration);

      this.logger.debug(`Métricas registradas: ${method} ${route} ${statusCode} ${duration.toFixed(3)}s`);
    } catch (error) {
      this.logger.error('Error registrando métricas:', error.message);
    }
  }
}
