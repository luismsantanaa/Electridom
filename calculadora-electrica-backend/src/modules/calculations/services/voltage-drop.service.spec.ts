import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoltageDropService } from './voltage-drop.service';
import { Resistivity } from '../entities/resistivity.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import { CalcFeederRequestDto } from '../dtos/calc-feeder-request.dto';

describe('VoltageDropService', () => {
  let service: VoltageDropService;
  let resistivityRepository: Repository<Resistivity>;
  let metricsService: MetricsService;
  let normParamService: NormParamService;

  const mockResistivityRepository = {
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
        VoltageDropService,
        {
          provide: getRepositoryToken(Resistivity),
          useValue: mockResistivityRepository,
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

    service = module.get<VoltageDropService>(VoltageDropService);
    resistivityRepository = module.get<Repository<Resistivity>>(
      getRepositoryToken(Resistivity),
    );
    metricsService = module.get<MetricsService>(MetricsService);
    normParamService = module.get<NormParamService>(NormParamService);

    // Configurar mocks por defecto
    mockResistivityRepository.find.mockResolvedValue([
      {
        material: 'Cu',
        seccionMm2: 2.5,
        ohmKm: 7.41,
      },
      {
        material: 'Cu',
        seccionMm2: 4,
        ohmKm: 4.61,
      },
      {
        material: 'Cu',
        seccionMm2: 6,
        ohmKm: 3.08,
      },
      {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
      },
      {
        material: 'Cu',
        seccionMm2: 16,
        ohmKm: 1.15,
      },
      {
        material: 'Cu',
        seccionMm2: 25,
        ohmKm: 0.727,
      },
    ]);

    mockNormParamService.getParamAsNumber
      .mockResolvedValueOnce(3) // vd_branch_limit_pct
      .mockResolvedValueOnce(5); // vd_total_limit_pct
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectFeeder', () => {
    const baseRequest: CalcFeederRequestDto = {
      circuitos_ramales: [
        {
          id_circuito: 'CIRC-001',
          name: 'Iluminación Habitación 1',
          corriente_total_a: 8.5,
          carga_total_va: 1020,
          length_m: 15,
        },
        {
          id_circuito: 'CIRC-002',
          name: 'Enchufes Habitación 1',
          corriente_total_a: 12.3,
          carga_total_va: 1476,
          length_m: 18,
        },
      ],
      system: {
        voltage_v: 120,
        phases: 1,
        corriente_total_a: 20.8,
        carga_total_va: 2496,
      },
      parameters: {
        longitud_alimentador_m: 50,
        material_conductor: 'Cu',
        max_caida_ramal_pct: 3,
        max_caida_total_pct: 5,
      },
      observaciones: ['Instalación residencial'],
    };

    it('should analyze voltage drop for residential installation', async () => {
      const result = await service.selectFeeder(baseRequest);

      expect(result.circuitos_analisis).toHaveLength(2);
      expect(result.feeder).toBeDefined();
      expect(result.resumen).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Verificar análisis de circuits
      expect(result.circuitos_analisis[0].estado).toBe('OK');
      expect(result.circuitos_analisis[0].caida_tension_ramal_pct).toBeLessThan(
        3,
      );
      expect(result.circuitos_analisis[1].estado).toBe('WARNING');
      expect(result.circuitos_analisis[1].caida_tension_ramal_pct).toBeLessThan(
        3,
      );

      // Verificar feeder
      expect(result.feeder.material).toBe('Cu');
      expect(result.feeder.section_mm2).toBeGreaterThan(0);
      expect(result.feeder.longitud_critica_m).toBeGreaterThan(0);
    });

    it('should handle circuits with long lengths (critical case)', async () => {
      const longLengthRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'Iluminación Exterior',
            corriente_total_a: 5.2,
            carga_total_va: 624,
            length_m: 80,
          },
          {
            id_circuito: 'CIRC-002',
            name: 'Bomba de Agua',
            corriente_total_a: 18.5,
            carga_total_va: 2220,
            length_m: 120,
          },
        ],
        system: {
          voltage_v: 240,
          phases: 1,
          corriente_total_a: 23.7,
          carga_total_va: 2844,
        },
        parameters: {
          longitud_alimentador_m: 200,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2.5,
          max_caida_total_pct: 4,
        },
      };

      const result = await service.selectFeeder(longLengthRequest);

      expect(result.circuitos_analisis).toHaveLength(2);

      // Verificar que los circuits largos tengan mayor caída de tensión
      const circuitosConAltaCaida = result.circuitos_analisis.filter(
        (c) => c.caida_tension_ramal_pct > 2,
      );
      expect(circuitosConAltaCaida.length).toBeGreaterThan(0);

      // Verificar que el feeder seleccione sección apropiada
      expect(result.feeder.section_mm2).toBeGreaterThanOrEqual(16);
    });

    it('should handle aluminum conductors', async () => {
      mockResistivityRepository.find.mockResolvedValue([
        {
          material: 'Al',
          seccionMm2: 10,
          ohmKm: 2.9,
        },
        {
          material: 'Al',
          seccionMm2: 16,
          ohmKm: 1.91,
        },
        {
          material: 'Al',
          seccionMm2: 25,
          ohmKm: 1.2,
        },
      ]);

      const aluminumRequest = {
        ...baseRequest,
        parameters: {
          ...baseRequest.parameters,
          material_conductor: 'Al',
        },
      };

      const result = await service.selectFeeder(aluminumRequest);

      expect(result.feeder.material).toBe('Al');
      expect(result.feeder.resistencia_ohm_km).toBe(1.91);
    });

    it('should handle three-phase systems', async () => {
      const threePhaseRequest = {
        ...baseRequest,
        system: {
          ...baseRequest.system,
          voltage_v: 208,
          phases: 3,
          corriente_total_a: 35.2,
          carga_total_va: 12672,
        },
      };

      const result = await service.selectFeeder(threePhaseRequest);

      expect(result.resumen.phases).toBe(3);
      expect(result.resumen.tension_nominal_v).toBe(208);

      // En trifásico, la caída de tensión debería ser menor que en monofásico
      expect(result.feeder.caida_tension_alimentador_pct).toBeLessThan(5);
    });

    it('should detect circuits exceeding voltage drop limits', async () => {
      const criticalRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'load Crítica',
            corriente_total_a: 25.0,
            carga_total_va: 3000,
            length_m: 150,
          },
        ],
        system: {
          voltage_v: 120,
          phases: 1,
          corriente_total_a: 25.0,
          carga_total_va: 3000,
        },
        parameters: {
          longitud_alimentador_m: 100,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2,
          max_caida_total_pct: 3,
        },
      };

      const result = await service.selectFeeder(criticalRequest);

      // Verificar que se detecten circuits fuera de límite
      const circuitosFueraLimite = result.circuitos_analisis.filter(
        (c) => c.estado === 'ERROR',
      );
      expect(circuitosFueraLimite.length).toBeGreaterThan(0);
      expect(result.resumen.circuitos_fuera_limite).toBeGreaterThan(0);
    });

    it('should calculate critical length correctly', async () => {
      const result = await service.selectFeeder(baseRequest);

      expect(result.feeder.longitud_critica_m).toBeGreaterThan(0);
      expect(result.feeder.longitud_critica_m).toBeLessThan(1000);

      // La longitud crítica debería ser mayor que la longitud del feeder
      expect(result.feeder.longitud_critica_m).toBeGreaterThan(
        baseRequest.parameters.longitud_alimentador_m,
      );
    });

    it('should handle default voltage drop limits from norm_const', async () => {
      mockNormParamService.getParamAsNumber
        .mockResolvedValueOnce(2.5) // vd_branch_limit_pct
        .mockResolvedValueOnce(4.0); // vd_total_limit_pct

      const requestWithoutLimits = {
        ...baseRequest,
        parameters: {
          ...baseRequest.parameters,
          max_caida_ramal_pct: undefined,
          max_caida_total_pct: undefined,
        },
      };

      const result = await service.selectFeeder(requestWithoutLimits);

      expect(result.resumen.limite_caida_ramal_pct).toBe(3);
      expect(result.resumen.limite_caida_total_pct).toBe(5);
    });

    it('should handle circuits without specified length', async () => {
      const requestWithoutLengths = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'circuit sin longitud',
            corriente_total_a: 10.0,
            carga_total_va: 1200,
            // length_m no especificada
          },
        ],
      };

      const result = await service.selectFeeder(requestWithoutLengths);

      expect(result.circuitos_analisis[0].length_m).toBe(20); // value por defecto
      expect(
        result.circuitos_analisis[0].caida_tension_ramal_pct,
      ).toBeGreaterThan(0);
    });

    it('should generate appropriate observations', async () => {
      const result = await service.selectFeeder(baseRequest);

      expect(result.observaciones_generales).toBeDefined();
      expect(result.observaciones_generales!.length).toBeGreaterThan(0);

      // Verificar que contenga información sobre el análisis
      const observationsText = result.observaciones_generales!.join(' ');
      expect(observationsText).toContain('circuits ramales');
      expect(observationsText).toContain('feeder');
    });

    it('should record metrics correctly', async () => {
      await service.selectFeeder(baseRequest);

      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'voltage_drop',
        'success',
      );
      expect(mockMetricsService.observeCalcDuration).toHaveBeenCalledWith(
        'voltage_drop',
        expect.any(Number),
      );
    });

    it('should handle high current loads', async () => {
      const highCurrentRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'load Industrial',
            corriente_total_a: 100.0,
            carga_total_va: 12000,
            length_m: 50,
          },
        ],
        system: {
          voltage_v: 480,
          phases: 3,
          corriente_total_a: 100.0,
          carga_total_va: 12000,
        },
        parameters: {
          longitud_alimentador_m: 80,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5,
        },
      };

      const result = await service.selectFeeder(highCurrentRequest);

      expect(result.feeder.corriente_total_a).toBe(100.0);
      expect(result.feeder.section_mm2).toBeGreaterThanOrEqual(16);
      expect(result.feeder.caida_tension_alimentador_pct).toBeLessThan(5);
    });

    it('should handle mixed material scenarios', async () => {
      // Simular que no hay resistividades disponibles para el material solicitado
      mockResistivityRepository.find.mockResolvedValueOnce([]);

      const result = await service.selectFeeder(baseRequest);

      // Debería manejar el caso cuando no hay resistividades
      expect(result.feeder).toBeDefined();
      expect(result.circuitos_analisis).toHaveLength(2);
    });

    it('should validate input parameters', async () => {
      const invalidRequest = {
        ...baseRequest,
        system: {
          ...baseRequest.system,
          voltage_v: 0, // Tensión inválida
        },
      };

      const result = await service.selectFeeder(invalidRequest);
      expect(result.feeder.estado).toBe('ERROR');
    });

    it('should handle edge case with very short lengths', async () => {
      const shortLengthRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'circuit Corto',
            corriente_total_a: 5.0,
            carga_total_va: 600,
            length_m: 2,
          },
        ],
        parameters: {
          longitud_alimentador_m: 5,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5,
        },
      };

      const result = await service.selectFeeder(shortLengthRequest);

      expect(result.circuitos_analisis[0].caida_tension_ramal_pct).toBeLessThan(
        1,
      );
      expect(result.feeder.caida_tension_alimentador_pct).toBeLessThan(2);
    });

    it('should handle maximum voltage drop limits', async () => {
      const maxDropRequest = {
        ...baseRequest,
        parameters: {
          ...baseRequest.parameters,
          max_caida_ramal_pct: 10,
          max_caida_total_pct: 15,
        },
      };

      const result = await service.selectFeeder(maxDropRequest);

      expect(result.resumen.limite_caida_ramal_pct).toBe(10);
      expect(result.resumen.limite_caida_total_pct).toBe(15);

      // Con límites altos, todos los circuits deberían estar OK
      const circuitosOK = result.circuitos_analisis.filter(
        (c) => c.estado === 'OK',
      );
      expect(circuitosOK.length).toBe(result.circuitos_analisis.length);
    });
  });
});
