import {
  All,
  Controller,
  Headers,
  Logger,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PlansGatewayService } from './plans-gateway.service';

/**
 * Proxies /api/plans/* to the Python plan-service.
 * Controller path is "plans" because Nest already applies global prefix "api".
 *
 * Uses @Res() and writes the response manually — must NOT return res.json(...)
 * or Nest will try to send the body again (ERR_HTTP_HEADERS_SENT).
 */
@ApiTags('Plans Gateway')
@Controller('plans')
export class PlansGatewayController {
  private readonly logger = new Logger(PlansGatewayController.name);

  constructor(private readonly plansGatewayService: PlansGatewayService) {}

  @All('health')
  @ApiOperation({ summary: 'Check plan-service health (via gateway)' })
  @ApiResponse({ status: 200, description: 'Plan service is healthy' })
  @ApiResponse({ status: 503, description: 'Plan service is unavailable' })
  async healthCheck(@Res() res: Response): Promise<void> {
    const result = await this.plansGatewayService.healthCheck();
    const status =
      result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json(result);
  }

  /** Exact /api/plans (list) */
  @All()
  @ApiOperation({ summary: 'Proxy to plan-service (collection)' })
  async proxyRoot(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ): Promise<void> {
    await this.forward(req, res, headers, '');
  }

  /** /api/plans/* (upload, detail, status, spaces, …) */
  @All('*path')
  @ApiOperation({ summary: 'Proxy to plan-service' })
  async proxyAll(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ): Promise<void> {
    const raw = req.params.path;
    const path = Array.isArray(raw) ? raw.join('/') : raw || '';
    const fullPath = path ? `/${path}` : '';
    await this.forward(req, res, headers, fullPath);
  }

  private async forward(
    req: Request,
    res: Response,
    headers: Record<string, string>,
    fullPath: string,
  ): Promise<void> {
    this.logger.debug(
      `Proxying ${req.method} /api/plans${fullPath} to plan-service`,
    );

    const contentType = String(headers['content-type'] || '');
    if (contentType.includes('multipart/form-data')) {
      await this.plansGatewayService.proxyMultipart(req, res, fullPath);
      return;
    }

    const result = await this.plansGatewayService.proxyRequest(
      req.method,
      fullPath,
      req.body,
      headers,
      req.query as Record<string, unknown>,
    );

    if (res.headersSent) {
      return;
    }

    // Status polling must not be cached as 304 with empty body (frontend hangs).
    if (fullPath.includes('/status')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.removeHeader('ETag');
    }

    res.status(result.status).json(result.data);
  }
}
