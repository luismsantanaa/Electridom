import { Controller, Get, Res, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Prometheus Metrics',
    description: 'Endpoint para exponer métricas en formato Prometheus (text/plain)',
  })
  @ApiHeader({
    name: 'X-Metrics-Token',
    description: 'Token opcional para proteger el endpoint',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas en formato Prometheus',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",route="/health",status_code="200"} 1',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de métricas inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Métricas deshabilitadas',
  })
  async getMetrics(
    @Res() res: Response,
    @Headers('x-metrics-token') token?: string,
  ): Promise<void> {
    // Verificar si las métricas están habilitadas
    const metricsEnabled = this.configService.get<boolean>('metrics.enabled');
    
    if (!metricsEnabled) {
      res.status(HttpStatus.FORBIDDEN).send('Métricas deshabilitadas');
      return;
    }

    // Verificar token si está configurado
    const configuredToken = this.configService.get<string>('metrics.token');
    
    if (configuredToken && token !== configuredToken) {
      throw new UnauthorizedException('Token de métricas inválido');
    }

    try {
      const metrics = await this.metricsService.getMetrics();
      res.setHeader('Content-Type', 'text/plain');
      res.status(HttpStatus.OK).send(metrics);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error generando métricas');
    }
  }
}
