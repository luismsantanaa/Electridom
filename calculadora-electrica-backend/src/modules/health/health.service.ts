import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, HealthIndicatorResult, HealthCheckError, HealthCheckResult } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly health: HealthCheckService,
  ) {}

  /**
   * Health check completo con liveness y readiness
   */
  async check(): Promise<HealthCheckResult> {
    try {
      const result = await this.health.check([
        () => this.livenessHealthCheck(),
        () => this.databaseHealthCheck(),
        () => this.diskHealthCheck(),
      ]);

      this.logger.log('Health check completado exitosamente');
      return result;
    } catch (error) {
      this.logger.error('Health check falló:', error.message);
      throw error;
    }
  }

  /**
   * Health check de liveness (proceso vivo)
   */
  private async livenessHealthCheck(): Promise<HealthIndicatorResult> {
    try {
      this.logger.debug('Liveness health check: OK');
      return {
        liveness: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Liveness health check failed:', error.message);
      throw new HealthCheckError(
        'Liveness check failed',
        {
          liveness: {
            status: 'down',
            error: error.message,
          },
        },
      );
    }
  }

  /**
   * Health check de base de datos (simulado)
   */
  private async databaseHealthCheck(): Promise<HealthIndicatorResult> {
    try {
      // Simular verificación de base de datos
      this.logger.debug('Database health check: OK (simulado)');
      return {
        database: {
          status: 'up',
          responseTime: 'fast',
          note: 'simulado',
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error.message);
      throw new HealthCheckError(
        'Database check failed',
        {
          database: {
            status: 'down',
            error: error.message,
          },
        },
      );
    }
  }

  /**
   * Health check de espacio en disco (simulado)
   */
  private async diskHealthCheck(): Promise<HealthIndicatorResult> {
    try {
      // Simular verificación de disco
      this.logger.debug('Disk health check: OK (simulado)');
      return {
        disk: {
          status: 'up',
          freeSpace: '1073741824 bytes',
          minRequired: '104857600 bytes',
          path: '/tmp',
          note: 'simulado',
        },
      };
    } catch (error) {
      this.logger.error('Disk health check failed:', error.message);
      throw new HealthCheckError(
        'Disk check failed',
        {
          disk: {
            status: 'down',
            error: error.message,
          },
        },
      );
    }
  }
}
