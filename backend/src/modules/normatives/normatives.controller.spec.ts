import { Test, TestingModule } from '@nestjs/testing';
import { NormativesController } from './normatives.controller';
import { NormativesService } from './normatives.service';

describe('NormativesController', () => {
  let controller: NormativesController;
  let service: NormativesService;

  const mockNormativesService = {
    listNormatives: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NormativesController],
      providers: [
        { provide: NormativesService, useValue: mockNormativesService },
      ],
    }).compile();

    controller = module.get<NormativesController>(NormativesController);
    service = module.get<NormativesService>(NormativesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listNormatives', () => {
    it('should return paginated normatives', async () => {
      const expected = {
        data: [{ id: '1', code: 'NEC-210.52' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
      mockNormativesService.listNormatives.mockResolvedValue(expected);

      const result = await controller.listNormatives({ page: 1, pageSize: 10 });

      expect(result).toEqual(expected);
      expect(service.listNormatives).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
    });

    it('should pass query filters', async () => {
      mockNormativesService.listNormatives.mockResolvedValue({ data: [] });

      await controller.listNormatives({
        page: 1,
        pageSize: 10,
        q: 'cocina',
        source: 'NEC' as any,
      });

      expect(service.listNormatives).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        q: 'cocina',
        source: 'NEC',
      });
    });
  });
});
