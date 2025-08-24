import { Injectable, Logger } from '@nestjs/common';
import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Métricas HTTP
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDurationSeconds: Histogram<string>;

  // Métricas personalizadas (opcionales)
  private readonly calcRunsTotal: Counter<string>;
  private readonly calcDurationSeconds: Histogram<string>;

  constructor() {
    // Registrar métricas por defecto de Node.js
    collectDefaultMetrics();

    // Inicializar métricas HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Inicializar métricas personalizadas
    this.calcRunsTotal = new Counter({
      name: 'calc_runs_total',
      help: 'Total number of calculation runs',
      labelNames: ['type', 'status'],
    });

    this.calcDurationSeconds = new Histogram({
      name: 'calc_duration_seconds',
      help: 'Calculation duration in seconds',
      labelNames: ['type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.logger.log('Métricas Prometheus inicializadas');
  }

  /**
   * Incrementar contador de requests HTTP
   */
  incrementHttpRequests(method: string, route: string, statusCode: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  /**
   * Observar duración de request HTTP
   */
  observeHttpRequestDuration(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDurationSeconds.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }

  /**
   * Incrementar contador de cálculos
   */
  incrementCalcRuns(type: string, status: string): void {
    this.calcRunsTotal.inc({ type, status });
  }

  /**
   * Observar duración de cálculo
   */
  observeCalcDuration(type: string, duration: number): void {
    this.calcDurationSeconds.observe({ type }, duration);
  }

  /**
   * Obtener métricas en formato Prometheus
   */
  async getMetrics(): Promise<string> {
    try {
      const metrics = await register.metrics();
      this.logger.debug('Métricas generadas exitosamente');
      return metrics;
    } catch (error) {
      this.logger.error('Error generando métricas:', error.message);
      throw error;
    }
  }
}
