import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import * as http from 'http';
import * as https from 'https';
import { Request, Response } from 'express';

/**
 * PlansGatewayService — Proxies plan-related requests to the Python plan-service.
 */
@Injectable()
export class PlansGatewayService {
  private readonly logger = new Logger(PlansGatewayService.name);
  private readonly planServiceBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.planServiceBaseUrl = this.configService.get<string>(
      'PLAN_SERVICE_URL',
      'http://localhost:8000',
    );
  }

  /**
   * Forward JSON/simple requests to the plan-service.
   */
  async proxyRequest(
    method: string,
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
    params?: Record<string, unknown>,
  ): Promise<{ status: number; data: unknown; headers: Record<string, string> }> {
    const url = `/api/plans${path}`;
    this.logger.debug(`Proxying ${method} ${url} to plan-service`);

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request({
          method: method.toLowerCase(),
          url,
          data,
          headers: this.filterHeaders(headers),
          params,
          maxBodyLength: 70 * 1024 * 1024,
          maxContentLength: 70 * 1024 * 1024,
          validateStatus: () => true,
        }),
      );

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      throw this.mapAxiosError(error as AxiosError);
    }
  }

  /**
   * Stream multipart uploads without re-encoding FormData (preserves boundary).
   */
  proxyMultipart(req: Request, res: Response, path: string): Promise<void> {
    return new Promise((resolve) => {
      const targetUrl = new URL(
        `${this.planServiceBaseUrl.replace(/\/$/, '')}/api/plans${path}`,
      );
      const isHttps = targetUrl.protocol === 'https:';
      const lib = isHttps ? https : http;

      const headers: Record<string, string | string[] | undefined> = {
        ...req.headers,
        host: targetUrl.host,
      };
      delete headers['connection'];
      delete headers['content-length']; // let node recompute if needed; keep for stream
      // Preserve content-length and content-type from original multipart request
      headers['content-type'] = req.headers['content-type'];
      headers['content-length'] = req.headers['content-length'];

      const proxyReq = lib.request(
        {
          protocol: targetUrl.protocol,
          hostname: targetUrl.hostname,
          port: targetUrl.port || (isHttps ? 443 : 80),
          path: `${targetUrl.pathname}${targetUrl.search}`,
          method: req.method,
          headers,
          timeout: 180_000,
        },
        (proxyRes) => {
          res.status(proxyRes.statusCode || 502);
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (value !== undefined) {
              res.setHeader(key, value);
            }
          }
          proxyRes.pipe(res);
          proxyRes.on('end', () => resolve());
        },
      );

      proxyReq.on('error', (err) => {
        this.logger.error(`Multipart proxy error: ${err.message}`);
        if (!res.headersSent) {
          res.status(HttpStatus.BAD_GATEWAY).json({
            statusCode: HttpStatus.BAD_GATEWAY,
            message: 'Error communicating with plan service.',
            error: 'PLAN_SERVICE_ERROR',
          });
        }
        resolve();
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.status(HttpStatus.GATEWAY_TIMEOUT).json({
            statusCode: HttpStatus.GATEWAY_TIMEOUT,
            message: 'Plan service request timed out.',
            error: 'PLAN_SERVICE_TIMEOUT',
          });
        }
        resolve();
      });

      req.pipe(proxyReq);
    });
  }

  async healthCheck(): Promise<{ status: string; checks: Record<string, string> }> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get('/health', {
          validateStatus: () => true,
        }),
      );
      return response.data;
    } catch {
      return {
        status: 'unavailable',
        checks: { plan_service: 'error: connection refused' },
      };
    }
  }

  private filterHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};

    const allowedPrefixes = ['x-', 'authorization'];
    const allowedHeaders = ['content-type', 'accept'];

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (
        allowedHeaders.includes(lowerKey) ||
        allowedPrefixes.some((prefix) => lowerKey.startsWith(prefix))
      ) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  private mapAxiosError(axiosError: AxiosError): HttpException {
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      this.logger.error(`Plan service unavailable: ${axiosError.message}`);
      return new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Plan service is currently unavailable. Please try again later.',
          error: 'PLAN_SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      this.logger.error(`Plan service timeout: ${axiosError.message}`);
      return new HttpException(
        {
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Plan service request timed out.',
          error: 'PLAN_SERVICE_TIMEOUT',
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    this.logger.error(`Plan service error: ${axiosError.message}`);
    return new HttpException(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Error communicating with plan service.',
        error: 'PLAN_SERVICE_ERROR',
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
