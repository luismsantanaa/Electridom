import { Test, TestingModule } from '@nestjs/testing';
import { PlansGatewayController } from './plans-gateway.controller';
import { PlansGatewayService } from './plans-gateway.service';
import { HttpStatus } from '@nestjs/common';

describe('PlansGatewayController', () => {
  let controller: PlansGatewayController;
  let service: PlansGatewayService;

  const mockPlansGatewayService = {
    healthCheck: jest.fn(),
    proxyRequest: jest.fn(),
    proxyMultipart: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    res.removeHeader = jest.fn();
    res.headersSent = false;
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansGatewayController],
      providers: [
        { provide: PlansGatewayService, useValue: mockPlansGatewayService },
      ],
    }).compile();

    controller = module.get<PlansGatewayController>(PlansGatewayController);
    service = module.get<PlansGatewayService>(PlansGatewayService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── healthCheck ───────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return 200 when plan-service is healthy', async () => {
      const res = mockResponse();
      mockPlansGatewayService.healthCheck.mockResolvedValue({
        status: 'ok',
        checks: { plan_service: 'ok' },
      });

      await controller.healthCheck(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        checks: { plan_service: 'ok' },
      });
    });

    it('should return 503 when plan-service is unavailable', async () => {
      const res = mockResponse();
      mockPlansGatewayService.healthCheck.mockResolvedValue({
        status: 'unavailable',
        checks: { plan_service: 'error' },
      });

      await controller.healthCheck(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  // ─── proxyRoot ─────────────────────────────────────────────────────────

  describe('proxyRoot', () => {
    it('should proxy GET /api/plans', async () => {
      const res = mockResponse();
      const req = { method: 'GET', body: null, query: {}, params: {} };
      mockPlansGatewayService.proxyRequest.mockResolvedValue({
        status: 200,
        data: { plans: [] },
      });

      await controller.proxyRoot(req as any, res, {});

      expect(service.proxyRequest).toHaveBeenCalledWith(
        'GET', '', null, {}, {},
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ plans: [] });
    });
  });

  // ─── proxyAll ──────────────────────────────────────────────────────────

  describe('proxyAll', () => {
    it('should proxy GET /api/plans/123', async () => {
      const res = mockResponse();
      const req = { method: 'GET', body: null, query: {}, params: { path: '123' } };
      mockPlansGatewayService.proxyRequest.mockResolvedValue({
        status: 200,
        data: { id: '123' },
      });

      await controller.proxyAll(req as any, res, {});

      expect(service.proxyRequest).toHaveBeenCalledWith(
        'GET', '/123', null, {}, {},
      );
    });

    it('should handle array path params', async () => {
      const res = mockResponse();
      const req = {
        method: 'GET',
        body: null,
        query: {},
        params: { path: ['123', 'spaces'] },
      };
      mockPlansGatewayService.proxyRequest.mockResolvedValue({
        status: 200,
        data: [],
      });

      await controller.proxyAll(req as any, res, {});

      expect(service.proxyRequest).toHaveBeenCalledWith(
        'GET', '/123/spaces', null, {}, {},
      );
    });

    it('should set no-cache headers for status endpoints', async () => {
      const res = mockResponse();
      const req = {
        method: 'GET',
        body: null,
        query: {},
        params: { path: '123/status' },
      };
      mockPlansGatewayService.proxyRequest.mockResolvedValue({
        status: 200,
        data: { status: 'completed' },
      });

      await controller.proxyAll(req as any, res, {});

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store, no-cache, must-revalidate',
      );
    });
  });
});
