import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * PlansGatewayService — Proxies plan-related requests to the Python plan-service.
 *
 * This service acts as a gateway between the NestJS backend (which handles auth,
 * business logic, and the frontend) and the Python FastAPI plan-service (which
 * handles PDF/DXF parsing and space detection).
 */
@Injectable()
export class PlansGatewayService {
  private readonly logger = new Logger(PlansGatewayService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Forward a request to the plan-service and return the response.
   */
  async proxyRequest(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>,
  ): Promise<{ status: number; data: any; headers: Record<string, string> }> {
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
          validateStatus: () => true, // Don't throw on non-2xx
        }),
      );

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
        this.logger.error(`Plan service unavailable: ${axiosError.message}`);
        throw new HttpException(
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
        throw new HttpException(
          {
            statusCode: HttpStatus.GATEWAY_TIMEOUT,
            message: 'Plan service request timed out.',
            error: 'PLAN_SERVICE_TIMEOUT',
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      this.logger.error(`Plan service error: ${axiosError.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Error communicating with plan service.',
          error: 'PLAN_SERVICE_ERROR',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Check if the plan-service is healthy.
   */
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

  /**
   * Filter headers to forward — only pass relevant headers, strip host/connection/etc.
   */
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
}
