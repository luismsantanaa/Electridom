import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: mockHealthService },
        { provide: HealthCheckService, useValue: {} },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const expected = {
        status: 'ok',
        details: {
          liveness: { status: 'up' },
          database: { status: 'up' },
          disk: { status: 'up' },
        },
      };
      mockHealthService.check.mockResolvedValue(expected);

      const result = await controller.check();

      expect(result).toEqual(expected);
      expect(healthService.check).toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      mockHealthService.check.mockRejectedValue(new Error('Health check failed'));

      await expect(controller.check()).rejects.toThrow('Health check failed');
    });
  });
});

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: HealthCheckService;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HealthCheckService, useValue: mockHealthCheckService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy result', async () => {
      const expected = { status: 'ok' };
      mockHealthCheckService.check.mockResolvedValue(expected);

      const result = await service.check();

      expect(result).toEqual(expected);
    });

    it('should throw on failure', async () => {
      mockHealthCheckService.check.mockRejectedValue(new Error('Failed'));

      await expect(service.check()).rejects.toThrow();
    });
  });
});
