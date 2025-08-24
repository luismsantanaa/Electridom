import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CircuitService } from './circuit.service';
import { Ampacity } from '../entities/ampacity.entity';
import { BreakerCurve } from '../entities/breaker-curve.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import { CalcCircuitsRequestDto } from '../dtos/calc-circuits-request.dto';

describe('CircuitService', () => {
  let service: CircuitService;
  let ampacityRepository: Repository<Ampacity>;
  let breakerRepository: Repository<BreakerCurve>;
  let metricsService: MetricsService;
  let normParamService: NormParamService;

  const mockAmpacityRepository = {
    find: jest.fn(),
  };

  const mockBreakerRepository = {
    find: jest.fn(),
  };

  const mockMetricsService = {
    incrementCalcRuns: jest.fn(),
    observeCalcDuration: jest.fn(),
  };

  const mockNormParamService = {
    getParamAsNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitService,
        {
          provide: getRepositoryToken(Ampacity),
          useValue: mockAmpacityRepository,
        },
        {
          provide: getRepositoryToken(BreakerCurve),
          useValue: mockBreakerRepository,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: NormParamService,
          useValue: mockNormParamService,
        },
      ],
    }).compile();

    service = module.get<CircuitService>(CircuitService);
    ampacityRepository = module.get<Repository<Ampacity>>(
      getRepositoryToken(Ampacity),
    );
    breakerRepository = module.get<Repository<BreakerCurve>>(
      getRepositoryToken(BreakerCurve),
    );
    metricsService = module.get<MetricsService>(MetricsService);
    normParamService = module.get<NormParamService>(NormParamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('groupIntoCircuits', () => {
    const mockAmpacities: Ampacity[] = [
      {
        id: '1',
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 12,
        seccionMm2: 3.31,
        amp: 20,
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '2',
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 10,
        seccionMm2: 5.26,
        amp: 30,
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '3',
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 8,
        seccionMm2: 8.37,
        amp: 55,
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
    ];

    const mockBreakers: BreakerCurve[] = [
      {
        id: '1',
        amp: 15,
        poles: 1,
        curve: 'C',
        useCase: 'iluminacion',
        notes: 'Breaker para iluminación',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '2',
        amp: 20,
        poles: 1,
        curve: 'C',
        useCase: 'tomas generales',
        notes: 'Breaker para tomas',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
      {
        id: '3',
        amp: 30,
        poles: 2,
        curve: 'C',
        useCase: 'electrodomestico',
        notes: 'Breaker para electrodomésticos',
        active: true,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        creationDate: new Date(),
        updateDate: new Date(),
      },
    ];

    const baseRequest: CalcCircuitsRequestDto = {
      cargas_diversificadas: [
        {
          categoria: 'lighting_general',
          carga_diversificada_va: 1000,
          factor_demanda: 1.0,
          descripcion: 'Iluminación general',
          ambiente: 'Sala',
        },
        {
          categoria: 'electrodomesticos',
          carga_diversificada_va: 2000,
          factor_demanda: 0.85,
          descripcion: 'Electrodomésticos',
          ambiente: 'Cocina',
        },
      ],
      sistema: {
        tension_v: 120,
        phases: 1,
        system_type: 1,
        frequency: 60,
      },
      observaciones: ['Test'],
    };

    beforeEach(() => {
      mockAmpacityRepository.find.mockResolvedValue(mockAmpacities);
      mockBreakerRepository.find.mockResolvedValue(mockBreakers);
      mockNormParamService.getParamAsNumber.mockResolvedValue(0.8);
    });

    it('should group loads into circuits correctly', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.circuitos_ramales).toHaveLength(2);
      expect(result.circuitos_ramales[0].nombre).toContain('lighting_general');
      expect(result.circuitos_ramales[1].nombre).toContain('electrodomesticos');
    });

    it('should select appropriate breakers and conductors', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.circuitos_ramales[0].breaker.amp).toBe(15);
      expect(result.circuitos_ramales[0].conductor.calibre_awg).toBe(12);
      expect(result.circuitos_ramales[1].breaker.amp).toBe(20);
      expect(result.circuitos_ramales[1].conductor.calibre_awg).toBe(12);
    });

    it('should calculate utilization percentage correctly', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      const circuito1 = result.circuitos_ramales[0];
      const corriente1 = 1000 / 120; // 8.33A
      const utilizacion1 = (corriente1 / circuito1.breaker.amp) * 100;
      expect(circuito1.utilizacion_pct).toBeCloseTo(utilizacion1, 1);
    });

    it('should handle continuous loads with 125% margin', async () => {
      const requestWithContinuousLoad = {
        ...baseRequest,
        cargas_diversificadas: [
          {
            categoria: 'climatizacion',
            carga_diversificada_va: 2400,
            factor_demanda: 1.0,
            descripcion: 'Aire acondicionado',
            ambiente: 'Habitación',
          },
        ],
      };

      const result = await service.groupIntoCircuits(requestWithContinuousLoad);

      expect(result.circuitos_ramales[0].margen_seguridad_pct).toBe(125);
    });

    it('should generate correct summary', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.resumen.total_circuitos).toBe(2);
      expect(result.resumen.carga_total_va).toBe(3000);
      expect(result.resumen.circuitos_monofasicos).toBe(2);
      expect(result.resumen.circuitos_trifasicos).toBe(0);
    });

    it('should handle empty loads array', async () => {
      const emptyRequest = {
        ...baseRequest,
        cargas_diversificadas: [],
      };

      const result = await service.groupIntoCircuits(emptyRequest);

      expect(result.circuitos_ramales).toHaveLength(0);
      expect(result.resumen.total_circuitos).toBe(0);
    });

    it('should handle high utilization warnings', async () => {
      const highLoadRequest = {
        ...baseRequest,
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            carga_diversificada_va: 2000, // Alta carga
            factor_demanda: 1.0,
            descripcion: 'Iluminación intensiva',
            ambiente: 'Oficina',
          },
        ],
      };

      const result = await service.groupIntoCircuits(highLoadRequest);

      const observacionesText = result.observaciones_generales?.join(' ') || '';
      expect(observacionesText).toContain('alta utilización');
    });

    it('should handle three-phase system', async () => {
      const threePhaseRequest = {
        ...baseRequest,
        sistema: {
          tension_v: 208,
          phases: 3,
          system_type: 3,
          frequency: 60,
        },
      };

      const result = await service.groupIntoCircuits(threePhaseRequest);

      expect(result.circuitos_ramales[0].tension_v).toBe(208);
      expect(result.circuitos_ramales[0].phases).toBe(3);
    });

    it('should group loads by category', async () => {
      const multipleLoadsRequest = {
        ...baseRequest,
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            carga_diversificada_va: 500,
            factor_demanda: 1.0,
            descripcion: 'Iluminación 1',
            ambiente: 'Sala',
          },
          {
            categoria: 'lighting_general',
            carga_diversificada_va: 300,
            factor_demanda: 1.0,
            descripcion: 'Iluminación 2',
            ambiente: 'Cocina',
          },
        ],
      };

      const result = await service.groupIntoCircuits(multipleLoadsRequest);

      expect(result.circuitos_ramales).toHaveLength(1);
      expect(result.circuitos_ramales[0].cargas).toHaveLength(2);
    });

    it('should handle loads that exceed circuit capacity', async () => {
      const highLoadRequest = {
        ...baseRequest,
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            carga_diversificada_va: 3000, // Muy alta carga
            factor_demanda: 1.0,
            descripcion: 'Iluminación muy intensiva',
            ambiente: 'Gimnasio',
          },
        ],
      };

      const result = await service.groupIntoCircuits(highLoadRequest);

      expect(result.circuitos_ramales).toHaveLength(1);
      expect(result.circuitos_ramales[0].breaker.amp).toBeGreaterThanOrEqual(
        20,
      );
    });

    it('should include metadata in response', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.version).toBe('1.0');
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duracion_calculo_ms).toBeGreaterThanOrEqual(0);
      expect(result.metadata!.algoritmo_usado).toBe(
        'grouping_by_category_with_80pct_rule',
      );
    });

    it('should record metrics correctly', async () => {
      await service.groupIntoCircuits(baseRequest);

      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'circuits',
        'success',
      );
      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'circuits_total',
        'success',
      );
      expect(mockMetricsService.observeCalcDuration).toHaveBeenCalledWith(
        'circuits',
        expect.any(Number),
      );
    });

    it('should handle database error gracefully', async () => {
      mockAmpacityRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.groupIntoCircuits(baseRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle missing normative parameters', async () => {
      mockNormParamService.getParamAsNumber.mockResolvedValue(null);

      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.circuitos_ramales).toHaveLength(2);
      // Debería usar el valor por defecto de 0.8
    });

    it('should calculate conductor selection correctly', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      // Verificar que el conductor seleccionado soporte la corriente de diseño
      const circuito1 = result.circuitos_ramales[0];
      expect(circuito1.conductor.ampacity).toBeGreaterThanOrEqual(
        circuito1.corriente_total_a,
      );
    });

    it('should handle different breaker curves', async () => {
      const result = await service.groupIntoCircuits(baseRequest);

      expect(result.circuitos_ramales[0].breaker.curve).toBe('C');
      expect(result.circuitos_ramales[0].breaker.use_case).toBeDefined();
    });
  });
});
