import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica el estado de salud de la aplicación (liveness y readiness)',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicación saludable',
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicación no saludable (readiness failure)',
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
