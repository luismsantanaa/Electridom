import { Test, TestingModule } from '@nestjs/testing';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportType, ExportStatus } from './dtos/export.dto';

describe('ExportsController', () => {
  let controller: ExportsController;
  let service: ExportsService;

  const mockExportsService = {
    listExports: jest.fn(),
    createExport: jest.fn(),
    downloadExport: jest.fn(),
    deleteExport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportsController],
      providers: [
        { provide: ExportsService, useValue: mockExportsService },
      ],
    }).compile();

    controller = module.get<ExportsController>(ExportsController);
    service = module.get<ExportsService>(ExportsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listExports', () => {
    it('should return paginated exports', async () => {
      const expected = {
        data: [{ id: '1', type: ExportType.PDF }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
      mockExportsService.listExports.mockResolvedValue(expected);

      const result = await controller.listExports({ page: 1, pageSize: 10 });

      expect(result).toEqual(expected);
    });
  });

  describe('createExport', () => {
    it('should create an export', async () => {
      const dto = {
        projectId: 'uuid-1',
        type: ExportType.PDF,
        scope: 'Test',
      };
      const expected = {
        id: 'export-1',
        projectId: 'uuid-1',
        status: ExportStatus.PENDING,
      };
      mockExportsService.createExport.mockResolvedValue(expected);

      const result = await controller.createExport(dto as any);

      expect(result).toEqual(expected);
    });
  });

  describe('deleteExport', () => {
    it('should delete an export', async () => {
      mockExportsService.deleteExport.mockResolvedValue(undefined);

      await controller.deleteExport('export-1');

      expect(service.deleteExport).toHaveBeenCalledWith('export-1');
    });
  });
});

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportsService],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listExports', () => {
    it('should return paginated exports', async () => {
      const result = await service.listExports({ page: 1, pageSize: 10 });

      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const page1 = await service.listExports({ page: 1, pageSize: 2 });
      const page2 = await service.listExports({ page: 2, pageSize: 2 });

      expect(page1.data.length).toBe(2);
      expect(page1.data[0].id).not.toBe(page2.data[0]?.id);
    });
  });

  describe('createExport', () => {
    it('should create a pending export', async () => {
      const result = await service.createExport({
        projectId: 'uuid-1',
        type: ExportType.PDF,
        scope: 'Test',
      });

      expect(result.status).toBe(ExportStatus.PENDING);
      expect(result.projectId).toBe('uuid-1');
    });
  });

  describe('deleteExport', () => {
    it('should delete an existing export', async () => {
      // First create one
      const created = await service.createExport({
        projectId: 'uuid-del',
        type: ExportType.JSON,
        scope: 'Delete test',
      });

      await service.deleteExport(created.id);

      // Verify it's gone by trying to delete again
      await expect(service.deleteExport(created.id)).rejects.toThrow();
    });

    it('should throw for non-existent export', async () => {
      await expect(service.deleteExport('nonexistent')).rejects.toThrow();
    });
  });
});
