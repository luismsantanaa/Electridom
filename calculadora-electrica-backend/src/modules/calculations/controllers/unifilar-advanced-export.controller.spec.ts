import { Test, TestingModule } from '@nestjs/testing';
import { UnifilarAdvancedExportController } from './unifilar-advanced-export.controller';
import { UnifilarAdvancedExportService } from '../services/unifilar-advanced-export.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UnifilarAdvancedExportController', () => {
  let controller: UnifilarAdvancedExportController;
  let service: UnifilarAdvancedExportService;

  const mockUnifilarAdvancedExportService = {
    generateAdvancedUnifilar: jest.fn(),
    validateAdvancedUnifilar: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnifilarAdvancedExportController],
      providers: [
        {
          provide: UnifilarAdvancedExportService,
          useValue: mockUnifilarAdvancedExportService,
        },
      ],
    }).compile();

    controller = module.get<UnifilarAdvancedExportController>(UnifilarAdvancedExportController);
    service = module.get<UnifilarAdvancedExportService>(UnifilarAdvancedExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportAdvancedUnifilar', () => {
    const projectId = 1;
    const mockUnifilarData = {
      projectId: 1,
      panels: [],
      phaseBalance: { isBalanced: true, maxImbalance: 5 },
      render: { symbols: 'IEC', orientation: 'vertical' },
      metadata: { totalCircuits: 10, totalLoadVA: 5000 }
    };

    beforeEach(() => {
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue(mockUnifilarData);
    });

    it('should export unifilar in JSON format successfully', async () => {
      const format = 'json';
      const pageSize = 'A3';
      const orientation = 'vertical';

      await controller.exportAdvancedUnifilar(
        projectId,
        format,
        pageSize,
        orientation,
        'true',
        'true',
        mockResponse as any
      );

      expect(service.generateAdvancedUnifilar).toHaveBeenCalledWith(projectId, {
        format: 'json',
        includeMetadata: true,
        includeSymbols: true,
        pageSize: 'A3',
        orientation: 'vertical'
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="unifilar-avanzado-proyecto-${projectId}.json"`
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUnifilarData);
    });

    it('should export unifilar in PDF format successfully', async () => {
      const mockPdfBuffer = Buffer.from('fake-pdf-content');
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue(mockPdfBuffer);

      const format = 'pdf';
      const pageSize = 'A4';
      const orientation = 'horizontal';

      await controller.exportAdvancedUnifilar(
        projectId,
        format,
        pageSize,
        orientation,
        'true',
        'true',
        mockResponse as any
      );

      expect(service.generateAdvancedUnifilar).toHaveBeenCalledWith(projectId, {
        format: 'pdf',
        includeMetadata: true,
        includeSymbols: true,
        pageSize: 'A4',
        orientation: 'horizontal'
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="unifilar-avanzado-proyecto-${projectId}.pdf"`
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', mockPdfBuffer.length);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should throw error for invalid format', async () => {
      const invalidFormat = 'invalid';

      await expect(controller.exportAdvancedUnifilar(
        projectId,
        invalidFormat,
        'A3',
        'vertical',
        'true',
        'true',
        mockResponse as any
      )).rejects.toThrow(HttpException);

      expect(service.generateAdvancedUnifilar).not.toHaveBeenCalled();
    });

    it('should throw error for invalid page size', async () => {
      const invalidPageSize = 'invalid';

      await expect(controller.exportAdvancedUnifilar(
        projectId,
        'json',
        invalidPageSize,
        'vertical',
        'true',
        'true',
        mockResponse as any
      )).rejects.toThrow(HttpException);

      expect(service.generateAdvancedUnifilar).not.toHaveBeenCalled();
    });

    it('should throw error for invalid orientation', async () => {
      const invalidOrientation = 'invalid';

      await expect(controller.exportAdvancedUnifilar(
        projectId,
        'json',
        'A3',
        invalidOrientation,
        'true',
        'true',
        mockResponse as any
      )).rejects.toThrow(HttpException);

      expect(service.generateAdvancedUnifilar).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const errorMessage = 'Project not found';
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(controller.exportAdvancedUnifilar(
        projectId,
        'json',
        'A3',
        'vertical',
        'true',
        'true',
        mockResponse as any
      )).rejects.toThrow(HttpException);

      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle project not found errors', async () => {
      const errorMessage = 'Proyecto no encontrado';
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(controller.exportAdvancedUnifilar(
        999,
        'json',
        'A3',
        'vertical',
        'true',
        'true',
        mockResponse as any
      )).rejects.toThrow(HttpException);
    });
  });

  describe('validateAdvancedUnifilar', () => {
    const projectId = 1;
    const mockValidationResult = {
      isValid: true,
      errors: []
    };

    beforeEach(() => {
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue({
        projectId: 1,
        panels: [],
        phaseBalance: { isBalanced: true, maxImbalance: 5 }
      });
      mockUnifilarAdvancedExportService.validateAdvancedUnifilar.mockReturnValue(mockValidationResult);
    });

    it('should validate unifilar successfully', async () => {
      const result = await controller.validateAdvancedUnifilar(projectId);

      expect(service.generateAdvancedUnifilar).toHaveBeenCalledWith(projectId, { format: 'json' });
      expect(service.validateAdvancedUnifilar).toHaveBeenCalled();
      expect(result).toEqual(mockValidationResult);
    });

    it('should handle validation errors gracefully', async () => {
      const errorMessage = 'Project not found';
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(controller.validateAdvancedUnifilar(999)).rejects.toThrow(HttpException);
    });
  });

  describe('getPhaseBalance', () => {
    const projectId = 1;
    const mockPhaseBalance = {
      totalLoad: { A: 1500, B: 1200, C: 800 },
      maxImbalance: 12.5,
      isBalanced: true,
      recommendations: ['El balance de fases es aceptable']
    };

    beforeEach(() => {
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue({
        projectId: 1,
        panels: [],
        phaseBalance: mockPhaseBalance
      });
    });

    it('should return phase balance successfully', async () => {
      const result = await controller.getPhaseBalance(projectId);

      expect(service.generateAdvancedUnifilar).toHaveBeenCalledWith(projectId, { format: 'json' });
      expect(result).toEqual(mockPhaseBalance);
    });

    it('should handle phase balance errors gracefully', async () => {
      const errorMessage = 'Project not found';
      mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(controller.getPhaseBalance(999)).rejects.toThrow(HttpException);
    });
  });

  describe('parameter validation', () => {
    it('should accept valid boolean strings for includeMetadata', async () => {
      const validValues = ['true', 'false'];
      
      for (const value of validValues) {
        mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue(mockUnifilarData);
        
        await expect(controller.exportAdvancedUnifilar(
          1,
          'json',
          'A3',
          'vertical',
          value,
          'true',
          mockResponse as any
        )).resolves.not.toThrow();
      }
    });

    it('should accept valid boolean strings for includeSymbols', async () => {
      const validValues = ['true', 'false'];
      
      for (const value of validValues) {
        mockUnifilarAdvancedExportService.generateAdvancedUnifilar.mockResolvedValue(mockUnifilarData);
        
        await expect(controller.exportAdvancedUnifilar(
          1,
          'json',
          'A3',
          'vertical',
          'true',
          value,
          mockResponse as any
        )).resolves.not.toThrow();
      }
    });
  });

  // Mock data for testing
  const mockUnifilarData = {
    projectId: 1,
    panels: [],
    phaseBalance: { isBalanced: true, maxImbalance: 5 },
    render: { symbols: 'IEC', orientation: 'vertical' },
    metadata: { totalCircuits: 10, totalLoadVA: 5000 }
  };
});
