import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandService } from './demand.service';
import { DemandFactor } from '../entities/demand-factor.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { CalcDemandRequestDto } from '../dtos/calc-demand-request.dto';

describe('DemandService', () => {
  let service: DemandService;
  let demandFactorRepository: Repository<DemandFactor>;
  let metricsService: MetricsService;

  const mockDemandFactorRepository = {
    find: jest.fn(),
  };

  const mockMetricsService = {
    incrementCalcRuns: jest.fn(),
    observeCalcDuration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandService,
        {
          provide: getRepositoryToken(DemandFactor),
          useValue: mockDemandFactorRepository,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<DemandService>(DemandService);
    demandFactorRepository = module.get<Repository<DemandFactor>>(
      getRepositoryToken(DemandFactor),
    );
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('apply', () => {
    const mockDemandFactors: DemandFactor[] = [
      {
        id: '1',
        category: 'lighting_general',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'Factor base para iluminación',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '2',
        category: 'electrodomesticos',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 0.85,
        notes: 'Factor para electrodomésticos',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '3',
        category: 'tomas_generales',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'Factor para tomacorrientes',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
    ];

    const baseRequest: CalcDemandRequestDto = {
      cargas_por_categoria: [
        {
          category: 'lighting_general',
          carga_va: 1000,
          description: 'Iluminación general',
        },
        {
          category: 'electrodomesticos',
          carga_va: 2000,
          description: 'Electrodomésticos',
        },
      ],
      totales: {
        carga_total_va: 3000,
        voltage_v: 120,
        phases: 1,
      },
      observaciones: ['Test'],
    };

    beforeEach(() => {
      mockDemandFactorRepository.find.mockResolvedValue(mockDemandFactors);
    });

    it('should apply demand factors correctly', async () => {
      const result = await service.apply(baseRequest);

      expect(result.cargas_diversificadas).toHaveLength(2);
      expect(result.cargas_diversificadas[0]).toEqual({
        category: 'lighting_general',
        carga_original_va: 1000,
        demand_factor: 1.0,
        carga_diversificada_va: 1000,
        rango_aplicado: '0-999999 VA',
        observaciones: 'Factor base para iluminación',
      });
      expect(result.cargas_diversificadas[1]).toEqual({
        category: 'electrodomesticos',
        carga_original_va: 2000,
        demand_factor: 0.85,
        carga_diversificada_va: 1700,
        rango_aplicado: '0-999999 VA',
        observaciones: 'Factor para electrodomésticos',
      });
    });

    it('should calculate diversified totals correctly', async () => {
      const result = await service.apply(baseRequest);

      expect(result.totales_diversificados).toEqual({
        carga_total_original_va: 3000,
        carga_total_diversificada_va: 2700,
        factor_diversificacion_efectivo: 0.9,
        corriente_total_diversificada_a: 22.5,
        ahorro_carga_va: 300,
        porcentaje_ahorro: 10,
        voltage_v: 120,
        phases: 1,
      });
    });

    it('should handle category without defined factor', async () => {
      const requestWithUnknownCategory = {
        ...baseRequest,
        cargas_por_categoria: [
          {
            category: 'categoria_desconocida',
            carga_va: 500,
            description: 'Categoría sin factor definido',
          },
        ],
        totales: {
          carga_total_va: 500,
          voltage_v: 120,
          phases: 1,
        },
      };

      const result = await service.apply(requestWithUnknownCategory);

      expect(result.cargas_diversificadas[0]).toEqual({
        category: 'categoria_desconocida',
        carga_original_va: 500,
        demand_factor: 1.0,
        carga_diversificada_va: 500,
        rango_aplicado: 'Sin factor definido',
        observaciones: 'Factor por defecto 1.0 aplicado - sin diversificación',
      });
    });

    it('should generate correct observations', async () => {
      const result = await service.apply(baseRequest);

      expect(result.observaciones_generales).toContain(
        'Factores de demanda aplicados: 1, 0.85',
      );
      expect(result.observaciones_generales).toContain(
        'Categorías con mayor diversificación: electrodomesticos',
      );
    });

    it('should include metadata in response', async () => {
      const result = await service.apply(baseRequest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.version).toBe('1.0');
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duracion_calculo_ms).toBeGreaterThanOrEqual(0);
    });

    it('should record metrics correctly', async () => {
      await service.apply(baseRequest);

      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'demand',
        'success',
      );
      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'demand_va_total',
        'success',
      );
      expect(mockMetricsService.observeCalcDuration).toHaveBeenCalledWith(
        'demand',
        expect.any(Number),
      );
    });

    it('should handle empty loads array', async () => {
      const emptyRequest = {
        ...baseRequest,
        cargas_por_categoria: [],
        totales: {
          carga_total_va: 0,
          voltage_v: 120,
          phases: 1,
        },
      };

      const result = await service.apply(emptyRequest);

      expect(result.cargas_diversificadas).toHaveLength(0);
      expect(result.totales_diversificados.carga_total_original_va).toBe(0);
      expect(result.totales_diversificados.carga_total_diversificada_va).toBe(
        0,
      );
    });

    it('should handle zero voltage gracefully', async () => {
      const zeroVoltageRequest = {
        ...baseRequest,
        totales: {
          carga_total_va: 3000,
          voltage_v: 0,
          phases: 1,
        },
      };

      const result = await service.apply(zeroVoltageRequest);

      expect(
        result.totales_diversificados.corriente_total_diversificada_a,
      ).toBe(Infinity);
    });

    it('should handle large load values', async () => {
      const largeLoadRequest = {
        ...baseRequest,
        cargas_por_categoria: [
          {
            category: 'lighting_general',
            carga_va: 100000,
            description: 'load grande',
          },
        ],
        totales: {
          carga_total_va: 100000,
          voltage_v: 120,
          phases: 1,
        },
      };

      const result = await service.apply(largeLoadRequest);

      expect(result.cargas_diversificadas[0].carga_diversificada_va).toBe(
        100000,
      );
      expect(
        result.totales_diversificados.corriente_total_diversificada_a,
      ).toBe(833.33);
    });

    it('should handle decimal precision correctly', async () => {
      const decimalRequest = {
        ...baseRequest,
        cargas_por_categoria: [
          {
            category: 'electrodomesticos',
            carga_va: 1000.123,
            description: 'load con decimales',
          },
        ],
        totales: {
          carga_total_va: 1000.123,
          voltage_v: 120,
          phases: 1,
        },
      };

      const result = await service.apply(decimalRequest);

      expect(result.cargas_diversificadas[0].carga_diversificada_va).toBe(
        850.1,
      );
    });

    it('should handle multiple categories with same factor', async () => {
      const multipleCategoriesRequest = {
        ...baseRequest,
        cargas_por_categoria: [
          {
            category: 'lighting_general',
            carga_va: 500,
            description: 'Iluminación 1',
          },
          {
            category: 'tomas_generales',
            carga_va: 300,
            description: 'Tomas 1',
          },
        ],
        totales: {
          carga_total_va: 800,
          voltage_v: 120,
          phases: 1,
        },
      };

      const result = await service.apply(multipleCategoriesRequest);

      expect(result.cargas_diversificadas).toHaveLength(2);
      expect(result.cargas_diversificadas[0].demand_factor).toBe(1.0);
      expect(result.cargas_diversificadas[1].demand_factor).toBe(1.0);
    });

    it('should handle database error gracefully', async () => {
      mockDemandFactorRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.apply(baseRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle edge case with very small factor', async () => {
      const smallFactorFactors = [
        {
          ...mockDemandFactors[1],
          factor: 0.01,
        },
      ];
      mockDemandFactorRepository.find.mockResolvedValue(smallFactorFactors);

      const result = await service.apply(baseRequest);

      expect(result.cargas_diversificadas[1].carga_diversificada_va).toBe(20);
      expect(result.totales_diversificados.porcentaje_ahorro).toBe(66);
    });
  });
});

