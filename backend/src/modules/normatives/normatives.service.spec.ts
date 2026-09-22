import { Test, TestingModule } from '@nestjs/testing';
import { NormativesService } from './normatives.service';

describe('NormativesService', () => {
  let service: NormativesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NormativesService],
    }).compile();

    service = module.get<NormativesService>(NormativesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listNormatives', () => {
    it('should return all normatives with default pagination', async () => {
      const result = await service.listNormatives({ page: 1, pageSize: 10 });

      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter by source', async () => {
      const result = await service.listNormatives({
        page: 1,
        pageSize: 100,
        source: 'NEC' as any,
      });

      result.data.forEach((n) => {
        expect(n.source).toBe('NEC');
      });
    });

    it('should filter by search term', async () => {
      const result = await service.listNormatives({
        page: 1,
        pageSize: 100,
        q: 'cocina',
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((n) => {
        const matches =
          n.code.toLowerCase().includes('cocina') ||
          n.description.toLowerCase().includes('cocina') ||
          n.content.toLowerCase().includes('cocina');
        expect(matches).toBe(true);
      });
    });

    it('should return empty for non-matching search', async () => {
      const result = await service.listNormatives({
        page: 1,
        pageSize: 10,
        q: 'xyznonexistent',
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should paginate correctly', async () => {
      const page1 = await service.listNormatives({ page: 1, pageSize: 3 });
      const page2 = await service.listNormatives({ page: 2, pageSize: 3 });

      expect(page1.data.length).toBe(3);
      expect(page1.data[0].id).not.toBe(page2.data[0]?.id);
    });
  });
});
