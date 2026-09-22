import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { PlansGatewayService } from './plans-gateway.service';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

describe('PlansGatewayService', () => {
  let service: PlansGatewayService;
  let httpService: HttpService;

  const mockHttpService = {
    request: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansGatewayService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PlansGatewayService>(PlansGatewayService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── proxyRequest ──────────────────────────────────────────────────────

  describe('proxyRequest', () => {
    it('should proxy a GET request successfully', async () => {
      const axiosResponse: AxiosResponse = {
        data: { plans: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const result = await service.proxyRequest('GET', '/list');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ plans: [] });
    });

    it('should proxy a POST request with body', async () => {
      const axiosResponse: AxiosResponse = {
        data: { id: '123' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const result = await service.proxyRequest('POST', '/upload', { name: 'test' });

      expect(result.status).toBe(201);
    });

    it('should filter headers correctly', async () => {
      const axiosResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      await service.proxyRequest('GET', '/test', undefined, {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
        'X-Custom': 'value',
        'Host': 'should-be-removed',
      });

      const callArgs = mockHttpService.request.mock.calls[0][0];
      expect(callArgs.headers).toHaveProperty('Authorization');
      expect(callArgs.headers).toHaveProperty('Content-Type');
      expect(callArgs.headers).toHaveProperty('X-Custom');
      expect(callArgs.headers).not.toHaveProperty('Host');
    });

    it('should throw SERVICE_UNAVAILABLE on ECONNREFUSED', async () => {
      const axiosError = new AxiosError('Connection refused');
      axiosError.code = 'ECONNREFUSED';
      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(service.proxyRequest('GET', '/test')).rejects.toThrow();
    });

    it('should throw GATEWAY_TIMEOUT on ECONNABORTED', async () => {
      const axiosError = new AxiosError('Timeout');
      axiosError.code = 'ECONNABORTED';
      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(service.proxyRequest('GET', '/test')).rejects.toThrow();
    });
  });

  // ─── healthCheck ───────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return health status when plan-service is healthy', async () => {
      const axiosResponse: AxiosResponse = {
        data: { status: 'ok', checks: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.get.mockReturnValue(of(axiosResponse));

      const result = await service.healthCheck();

      expect(result.status).toBe('ok');
    });

    it('should return unavailable when plan-service is down', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      const result = await service.healthCheck();

      expect(result.status).toBe('unavailable');
    });
  });
});
