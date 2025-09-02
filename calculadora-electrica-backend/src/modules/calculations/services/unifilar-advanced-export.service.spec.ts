import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnifilarAdvancedExportService } from './unifilar-advanced-export.service';
import { UnifilarExportService } from './unifilar-export.service';
import { Protection } from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';

describe('UnifilarAdvancedExportService', () => {
  let service: UnifilarAdvancedExportService;
  let unifilarExportService: UnifilarExportService;
  let protectionRepository: Repository<Protection>;
  let circuitRepository: Repository<Circuit>;

  const mockUnifilarExportService = {
    generateUnifilar: jest.fn(),
  };

  const mockProtectionRepository = {
    find: jest.fn(),
  };

  const mockCircuitRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifilarAdvancedExportService,
        {
          provide: UnifilarExportService,
          useValue: mockUnifilarExportService,
        },
        {
          provide: getRepositoryToken(Protection),
          useValue: mockProtectionRepository,
        },
        {
          provide: getRepositoryToken(Circuit),
          useValue: mockCircuitRepository,
        },
      ],
    }).compile();

    service = module.get<UnifilarAdvancedExportService>(
      UnifilarAdvancedExportService,
    );
    unifilarExportService = module.get<UnifilarExportService>(
      UnifilarExportService,
    );
    protectionRepository = module.get<Repository<Protection>>(
      getRepositoryToken(Protection),
    );
    circuitRepository = module.get<Repository<Circuit>>(
      getRepositoryToken(Circuit),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAdvancedUnifilar', () => {
    const mockProjectId = 1;
    const mockBaseUnifilar = {
      projectId: mockProjectId,
      service: {
        voltage: '120/208V',
        phases: '3F+N',
        amperage: 200,
        type: 'commercial',
      },
      mainPanel: {
        id: 1,
        type: 'Main Panel',
        amperage: 200,
        voltage: '120/208V',
        phases: 3,
        symbols: ['main-panel'],
        circuits: [],
      },
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        totalCircuits: 0,
        totalLoadVA: 0,
      },
      symbols: {},
    };

    const mockCircuits = [
      {
        id: 1,
        projectId: mockProjectId,
        phase: 1,
        loadVA: 1200,
        conductorGauge: '14 AWG',
        areaType: 'cocina',
        protections: [
          {
            id: 1,
            breakerAmp: 20,
            breakerType: 'MCB',
            differentialType: 'GFCI',
          },
        ],
      },
      {
        id: 2,
        projectId: mockProjectId,
        phase: 2,
        loadVA: 800,
        conductorGauge: '14 AWG',
        areaType: 'dormitorio',
        protections: [
          {
            id: 2,
            breakerAmp: 15,
            breakerType: 'MCB',
            differentialType: 'NONE',
          },
        ],
      },
    ];

    beforeEach(() => {
      mockUnifilarExportService.generateUnifilar.mockResolvedValue(
        mockBaseUnifilar,
      );
      mockCircuitRepository.find.mockResolvedValue(mockCircuits);
    });

    it('should generate advanced unifilar in JSON format', async () => {
      const result = await service.generateAdvancedUnifilar(mockProjectId, {
        format: 'json',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('panels');
      expect(result).toHaveProperty('phaseBalance');
      expect(result).toHaveProperty('render');
      expect(result).toHaveProperty('projectId', mockProjectId);
    });

    it('should generate advanced unifilar in PDF format', async () => {
      const result = await service.generateAdvancedUnifilar(mockProjectId, {
        format: 'pdf',
      });

      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should calculate phase balance correctly', async () => {
      const result = (await service.generateAdvancedUnifilar(mockProjectId, {
        format: 'json',
      })) as any;

      expect(result.phaseBalance).toBeDefined();
      expect(result.phaseBalance.totalLoad).toBeDefined();
      expect(result.phaseBalance.totalLoad.A).toBe(1200);
      expect(result.phaseBalance.totalLoad.B).toBe(800);
      expect(result.phaseBalance.totalLoad.C).toBe(0);
      expect(result.phaseBalance.isBalanced).toBeDefined();
      expect(result.phaseBalance.recommendations).toBeDefined();
    });

    it('should generate panels with correct structure', async () => {
      const result = (await service.generateAdvancedUnifilar(mockProjectId, {
        format: 'json',
      })) as any;

      expect(result.panels).toBeDefined();
      expect(result.panels).toHaveLength(1);

      const mainPanel = result.panels[0];
      expect(mainPanel.id).toBe(1);
      expect(mainPanel.name).toBe('Tablero Principal');
      expect(mainPanel.type).toBe('Main Distribution Panel');
      expect(mainPanel.circuits).toHaveLength(2);
      expect(mainPanel.phaseMap).toBeDefined();
      expect(mainPanel.phaseMap.A).toContain(1);
      expect(mainPanel.phaseMap.B).toContain(2);
    });

    it('should apply render configuration correctly', async () => {
      const result = (await service.generateAdvancedUnifilar(mockProjectId, {
        format: 'json',
        pageSize: 'A4',
        orientation: 'horizontal',
      })) as any;

      expect(result.render).toBeDefined();
      expect(result.render.pageSize).toBe('A4');
      expect(result.render.orientation).toBe('horizontal');
      expect(result.render.symbols).toBe('IEC');
      expect(result.render.showGrid).toBe(true);
      expect(result.render.showLabels).toBe(true);
    });
  });

  describe('validateAdvancedUnifilar', () => {
    const mockUnifilar = {
      projectId: 1,
      panels: [
        {
          id: 1,
          name: 'Main Panel',
          circuits: [
            { id: 1, loadVA: 1200 },
            { id: 2, loadVA: 800 },
          ],
        },
      ],
      phaseBalance: {
        isBalanced: true,
        maxImbalance: 10,
      },
      metadata: {
        totalLoadVA: 2000,
      },
    };

    it('should validate balanced unifilar correctly', () => {
      const result = service.validateAdvancedUnifilar(mockUnifilar as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect phase imbalance', () => {
      const unbalancedUnifilar = {
        ...mockUnifilar,
        phaseBalance: {
          isBalanced: false,
          maxImbalance: 25,
        },
      };

      const result = service.validateAdvancedUnifilar(
        unbalancedUnifilar as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Desbalance de fases: 25.0%');
    });

    it('should detect empty panels', () => {
      const invalidUnifilar = {
        ...mockUnifilar,
        panels: [
          {
            id: 1,
            name: 'Empty Panel',
            circuits: [],
          },
        ],
      };

      const result = service.validateAdvancedUnifilar(invalidUnifilar as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Panel Empty Panel no tiene circuitos asignados',
      );
    });

    it('should detect load calculation inconsistency', () => {
      const inconsistentUnifilar = {
        ...mockUnifilar,
        metadata: {
          totalLoadVA: 3000, // Inconsistente con la suma real de 2000
        },
      };

      const result = service.validateAdvancedUnifilar(
        inconsistentUnifilar as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Inconsistencia en el cálculo de carga total',
      );
    });
  });

  describe('error handling', () => {
    it('should handle circuit repository errors gracefully', async () => {
      mockUnifilarExportService.generateUnifilar.mockResolvedValue(
        mockBaseUnifilar,
      );
      mockCircuitRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.generateAdvancedUnifilar(1, { format: 'json' }),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle unifilar export service errors gracefully', async () => {
      mockUnifilarExportService.generateUnifilar.mockRejectedValue(
        new Error('Project not found'),
      );

      await expect(
        service.generateAdvancedUnifilar(999, { format: 'json' }),
      ).rejects.toThrow('Project not found');
    });
  });

  // Mock data for testing
  const mockBaseUnifilar = {
    projectId: 1,
    service: {
      voltage: '120/208V',
      phases: '3F+N',
      amperage: 200,
      type: 'commercial',
    },
    mainPanel: {
      id: 1,
      type: 'Main Panel',
      amperage: 200,
      voltage: '120/208V',
      phases: 3,
      symbols: ['main-panel'],
      circuits: [],
    },
    metadata: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalCircuits: 0,
      totalLoadVA: 0,
    },
    symbols: {},
  };
});
