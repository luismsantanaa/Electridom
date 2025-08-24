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
          nombre: 'Iluminación Habitación 1',
          corriente_total_a: 8.5,
          carga_total_va: 1020,
          longitud_m: 15,
        },
        {
          id_circuito: 'CIRC-002',
          nombre: 'Enchufes Habitación 1',
          corriente_total_a: 12.3,
          carga_total_va: 1476,
          longitud_m: 18,
        },
      ],
      sistema: {
        tension_v: 120,
        phases: 1,
        corriente_total_a: 20.8,
        carga_total_va: 2496,
      },
      parametros: {
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
      expect(result.alimentador).toBeDefined();
      expect(result.resumen).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Verificar análisis de circuitos
      expect(result.circuitos_analisis[0].estado).toBe('OK');
      expect(result.circuitos_analisis[0].caida_tension_ramal_pct).toBeLessThan(
        3,
      );
      expect(result.circuitos_analisis[1].estado).toBe('WARNING');
      expect(result.circuitos_analisis[1].caida_tension_ramal_pct).toBeLessThan(
        3,
      );

      // Verificar alimentador
      expect(result.alimentador.material).toBe('Cu');
      expect(result.alimentador.seccion_mm2).toBeGreaterThan(0);
      expect(result.alimentador.longitud_critica_m).toBeGreaterThan(0);
    });

    it('should handle circuits with long lengths (critical case)', async () => {
      const longLengthRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            nombre: 'Iluminación Exterior',
            corriente_total_a: 5.2,
            carga_total_va: 624,
            longitud_m: 80,
          },
          {
            id_circuito: 'CIRC-002',
            nombre: 'Bomba de Agua',
            corriente_total_a: 18.5,
            carga_total_va: 2220,
            longitud_m: 120,
          },
        ],
        sistema: {
          tension_v: 240,
          phases: 1,
          corriente_total_a: 23.7,
          carga_total_va: 2844,
        },
        parametros: {
          longitud_alimentador_m: 200,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2.5,
          max_caida_total_pct: 4,
        },
      };

      const result = await service.selectFeeder(longLengthRequest);

      expect(result.circuitos_analisis).toHaveLength(2);

      // Verificar que los circuitos largos tengan mayor caída de tensión
      const circuitosConAltaCaida = result.circuitos_analisis.filter(
        (c) => c.caida_tension_ramal_pct > 2,
      );
      expect(circuitosConAltaCaida.length).toBeGreaterThan(0);

      // Verificar que el alimentador seleccione sección apropiada
      expect(result.alimentador.seccion_mm2).toBeGreaterThanOrEqual(16);
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
        parametros: {
          ...baseRequest.parametros,
          material_conductor: 'Al',
        },
      };

      const result = await service.selectFeeder(aluminumRequest);

      expect(result.alimentador.material).toBe('Al');
      expect(result.alimentador.resistencia_ohm_km).toBe(1.91);
    });

    it('should handle three-phase systems', async () => {
      const threePhaseRequest = {
        ...baseRequest,
        sistema: {
          ...baseRequest.sistema,
          tension_v: 208,
          phases: 3,
          corriente_total_a: 35.2,
          carga_total_va: 12672,
        },
      };

      const result = await service.selectFeeder(threePhaseRequest);

      expect(result.resumen.phases).toBe(3);
      expect(result.resumen.tension_nominal_v).toBe(208);

      // En trifásico, la caída de tensión debería ser menor que en monofásico
      expect(result.alimentador.caida_tension_alimentador_pct).toBeLessThan(5);
    });

    it('should detect circuits exceeding voltage drop limits', async () => {
      const criticalRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            nombre: 'Carga Crítica',
            corriente_total_a: 25.0,
            carga_total_va: 3000,
            longitud_m: 150,
          },
        ],
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 25.0,
          carga_total_va: 3000,
        },
        parametros: {
          longitud_alimentador_m: 100,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2,
          max_caida_total_pct: 3,
        },
      };

      const result = await service.selectFeeder(criticalRequest);

      // Verificar que se detecten circuitos fuera de límite
      const circuitosFueraLimite = result.circuitos_analisis.filter(
        (c) => c.estado === 'ERROR',
      );
      expect(circuitosFueraLimite.length).toBeGreaterThan(0);
      expect(result.resumen.circuitos_fuera_limite).toBeGreaterThan(0);
    });

    it('should calculate critical length correctly', async () => {
      const result = await service.selectFeeder(baseRequest);

      expect(result.alimentador.longitud_critica_m).toBeGreaterThan(0);
      expect(result.alimentador.longitud_critica_m).toBeLessThan(1000);

      // La longitud crítica debería ser mayor que la longitud del alimentador
      expect(result.alimentador.longitud_critica_m).toBeGreaterThan(
        baseRequest.parametros.longitud_alimentador_m,
      );
    });

    it('should handle default voltage drop limits from norm_const', async () => {
      mockNormParamService.getParamAsNumber
        .mockResolvedValueOnce(2.5) // vd_branch_limit_pct
        .mockResolvedValueOnce(4.0); // vd_total_limit_pct

      const requestWithoutLimits = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
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
            nombre: 'Circuito sin longitud',
            corriente_total_a: 10.0,
            carga_total_va: 1200,
            // longitud_m no especificada
          },
        ],
      };

      const result = await service.selectFeeder(requestWithoutLengths);

      expect(result.circuitos_analisis[0].longitud_m).toBe(20); // Valor por defecto
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
      expect(observationsText).toContain('circuitos ramales');
      expect(observationsText).toContain('Alimentador');
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
            nombre: 'Carga Industrial',
            corriente_total_a: 100.0,
            carga_total_va: 12000,
            longitud_m: 50,
          },
        ],
        sistema: {
          tension_v: 480,
          phases: 3,
          corriente_total_a: 100.0,
          carga_total_va: 12000,
        },
        parametros: {
          longitud_alimentador_m: 80,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5,
        },
      };

      const result = await service.selectFeeder(highCurrentRequest);

      expect(result.alimentador.corriente_total_a).toBe(100.0);
      expect(result.alimentador.seccion_mm2).toBeGreaterThanOrEqual(16);
      expect(result.alimentador.caida_tension_alimentador_pct).toBeLessThan(5);
    });

    it('should handle mixed material scenarios', async () => {
      // Simular que no hay resistividades disponibles para el material solicitado
      mockResistivityRepository.find.mockResolvedValueOnce([]);

      const result = await service.selectFeeder(baseRequest);

      // Debería manejar el caso cuando no hay resistividades
      expect(result.alimentador).toBeDefined();
      expect(result.circuitos_analisis).toHaveLength(2);
    });

    it('should validate input parameters', async () => {
      const invalidRequest = {
        ...baseRequest,
        sistema: {
          ...baseRequest.sistema,
          tension_v: 0, // Tensión inválida
        },
      };

      const result = await service.selectFeeder(invalidRequest);
      expect(result.alimentador.estado).toBe('ERROR');
    });

    it('should handle edge case with very short lengths', async () => {
      const shortLengthRequest = {
        ...baseRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            nombre: 'Circuito Corto',
            corriente_total_a: 5.0,
            carga_total_va: 600,
            longitud_m: 2,
          },
        ],
        parametros: {
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
      expect(result.alimentador.caida_tension_alimentador_pct).toBeLessThan(2);
    });

    it('should handle maximum voltage drop limits', async () => {
      const maxDropRequest = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          max_caida_ramal_pct: 10,
          max_caida_total_pct: 15,
        },
      };

      const result = await service.selectFeeder(maxDropRequest);

      expect(result.resumen.limite_caida_ramal_pct).toBe(10);
      expect(result.resumen.limite_caida_total_pct).toBe(15);

      // Con límites altos, todos los circuitos deberían estar OK
      const circuitosOK = result.circuitos_analisis.filter(
        (c) => c.estado === 'OK',
      );
      expect(circuitosOK.length).toBe(result.circuitos_analisis.length);
    });
  });
});
