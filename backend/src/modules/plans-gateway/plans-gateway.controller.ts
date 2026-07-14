import {
  Controller,
  All,
  Req,
  Res,
  Param,
  Query,
  Body,
  Headers,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PlansGatewayService } from './plans-gateway.service';

/**
 * PlansGatewayController — Proxies /api/plans/* requests to the Python plan-service.
 *
 * This controller catches all requests to /api/plans/* and forwards them
 * to the Python plan-service (FastAPI), preserving the request method,
 * body, query params, and relevant headers.
 */
@ApiTags('Plans Gateway')
@Controller('api/plans')
export class PlansGatewayController {
  private readonly logger = new Logger(PlansGatewayController.name);

  constructor(private readonly plansGatewayService: PlansGatewayService) {}

  /**
   * Health check for the plan-service (via gateway).
   */
  @All('health')
  @ApiOperation({ summary: 'Check plan-service health (via gateway)' })
  @ApiResponse({ status: 200, description: 'Plan service is healthy' })
  @ApiResponse({ status: 503, description: 'Plan service is unavailable' })
  async healthCheck(@Res() res: Response) {
    const result = await this.plansGatewayService.healthCheck();
    const status =
      result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(status).json(result);
  }

  /**
   * Catch-all proxy for /api/plans/* routes.
   * Forwards any HTTP method to the plan-service.
   */
  @All('*path')
  @ApiOperation({ summary: 'Proxy to plan-service' })
  async proxyAll(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ) {
    const fullPath = path ? `/${path}` : '';
    this.logger.debug(
      `Proxying ${req.method} /api/plans${fullPath} to plan-service`,
    );

    const result = await this.plansGatewayService.proxyRequest(
      req.method,
      fullPath,
      req.body,
      headers,
      req.query as Record<string, any>,
    );

    // Forward the response status and data
    return res.status(result.status).json(result.data);
  }
}
