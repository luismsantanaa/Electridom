import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { register } from 'prom-client';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: MetricsService;

  const mockMetricsService = {
    getMetrics: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics when enabled and no token configured', async () => {
      const res = mockResponse();
      mockConfigService.get
        .mockReturnValueOnce(true)  // metrics.enabled
        .mockReturnValueOnce(undefined); // metrics.token (no token configured)
      mockMetricsService.getMetrics.mockResolvedValue('# HELP test 1');

      await controller.getMetrics(res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith('# HELP test 1');
    });

    it('should return 403 when metrics disabled', async () => {
      const res = mockResponse();
      mockConfigService.get.mockReturnValue(false);

      await controller.getMetrics(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('should return 401 with invalid token', async () => {
      const res = mockResponse();
      mockConfigService.get
        .mockReturnValueOnce(true) // enabled
        .mockReturnValueOnce('secret-token'); // configured token

      await expect(controller.getMetrics(res, 'wrong-token')).rejects.toThrow();
    });

    it('should accept valid token', async () => {
      const res = mockResponse();
      mockConfigService.get
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('secret-token');
      mockMetricsService.getMetrics.mockResolvedValue('metrics');

      await controller.getMetrics(res, 'secret-token');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });
});

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    // Clear prom-client registry to avoid duplicate metric errors
    register.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics string', async () => {
      const result = await service.getMetrics();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('incrementHttpRequests', () => {
    it('should not throw', () => {
      expect(() => service.incrementHttpRequests('GET', '/test', 200)).not.toThrow();
    });
  });

  describe('observeHttpRequestDuration', () => {
    it('should not throw', () => {
      expect(() => service.observeHttpRequestDuration('GET', '/test', 200, 0.5)).not.toThrow();
    });
  });

  describe('incrementCalcRuns', () => {
    it('should not throw', () => {
      expect(() => service.incrementCalcRuns('rooms', 'success')).not.toThrow();
    });
  });

  describe('observeCalcDuration', () => {
    it('should not throw', () => {
      expect(() => service.observeCalcDuration('rooms', 1.5)).not.toThrow();
    });
  });
});
