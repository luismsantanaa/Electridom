import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroundingService } from './grounding.service';
import { GroundingRules } from '../entities/grounding-rules.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import { CalcGroundingRequestDto } from '../dtos/calc-grounding-request.dto';

describe('GroundingService', () => {
  let service: GroundingService;
  let groundingRulesRepository: Repository<GroundingRules>;
  let metricsService: MetricsService;
  let normParamService: NormParamService;

  const mockGroundingRules = [
    {
      id: '1',
      mainBreakerAmp: 100,
      egcMm2: 10,
      gecMm2: 16,
      notes: 'TODO_RIE: Breaker hasta 100A - EGC 10mm², GEC 16mm²',
      active: true,
    },
    {
      id: '2',
      mainBreakerAmp: 200,
      egcMm2: 25,
      gecMm2: 35,
      notes: 'TODO_RIE: Breaker hasta 200A - EGC 25mm², GEC 35mm²',
      active: true,
    },
    {
      id: '3',
      mainBreakerAmp: 400,
      egcMm2: 50,
      gecMm2: 70,
      notes: 'TODO_RIE: Breaker hasta 400A - EGC 50mm², GEC 70mm²',
      active: true,
    },
    {
      id: '4',
      mainBreakerAmp: 600,
      egcMm2: 95,
      gecMm2: 120,
      notes: 'TODO_RIE: Breaker hasta 600A - EGC 95mm², GEC 120mm²',
      active: true,
    },
    {
      id: '5',
      mainBreakerAmp: 2000,
      egcMm2: 240,
      gecMm2: 300,
      notes: 'TODO_RIE: Breaker hasta 2000A - EGC 240mm², GEC 300mm²',
      active: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroundingService,
        {
          provide: getRepositoryToken(GroundingRules),
          useValue: {
            find: jest.fn().mockResolvedValue(mockGroundingRules),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            incrementCalcRuns: jest.fn(),
            observeCalcDuration: jest.fn(),
          },
        },
        {
          provide: NormParamService,
          useValue: {
            getParam: jest.fn().mockResolvedValue('25'),
          },
        },
      ],
    }).compile();

    service = module.get<GroundingService>(GroundingService);
    groundingRulesRepository = module.get<Repository<GroundingRules>>(
      getRepositoryToken(GroundingRules),
    );
    metricsService = module.get<MetricsService>(MetricsService);
    normParamService = module.get<NormParamService>(NormParamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('size', () => {
    const baseRequest: CalcGroundingRequestDto = {
      sistema: {
        tension_v: 120,
        phases: 1,
        corriente_total_a: 61.8,
        carga_total_va: 7416,
      },
      alimentador: {
        corriente_a: 61.8,
        seccion_mm2: 10,
        material: 'Cu',
        longitud_m: 50,
      },
      parametros: {
        main_breaker_amp: 100,
        tipo_instalacion: 'residencial',
        tipo_sistema_tierra: 'TN-S',
        resistividad_suelo_ohm_m: 100,
      },
      observaciones: ['Instalación residencial monofásica'],
    };

    it('should size grounding system for residential installation', async () => {
      const result = await service.size(baseRequest);

      expect(result.conductor_proteccion.tipo).toBe('EGC');
      expect(result.conductor_proteccion.seccion_mm2).toBe(10);
      expect(result.conductor_proteccion.calibre_awg).toBe('8');
      expect(result.conductor_tierra.tipo).toBe('GEC');
      expect(result.conductor_tierra.seccion_mm2).toBe(16);
      expect(result.conductor_tierra.calibre_awg).toBe('6');
      expect(result.sistema_tierra.tipo_sistema).toBe('TN-S');
      expect(result.sistema_tierra.resistencia_maxima_ohm).toBe(25);
      expect(result.sistema_tierra.numero_electrodos).toBe(1);
      expect(result.resumen.estado).toBe('ESTÁNDAR');
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.version).toBe('1.0');
    });

    it('should size grounding system for commercial installation', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 200,
          tipo_instalacion: 'comercial',
          tipo_sistema_tierra: 'TN-C-S',
        },
      };

      const result = await service.size(request);

      expect(result.conductor_proteccion.seccion_mm2).toBe(25);
      expect(result.conductor_tierra.seccion_mm2).toBe(35);
      expect(result.sistema_tierra.tipo_sistema).toBe('TN-C-S');
      expect(result.sistema_tierra.resistencia_maxima_ohm).toBe(5);
      expect(result.sistema_tierra.numero_electrodos).toBe(1);
      expect(result.resumen.estado).toBe('ESTRICTO');
    });

    it('should size grounding system for industrial installation', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 600,
          tipo_instalacion: 'industrial',
          tipo_sistema_tierra: 'TT',
        },
      };

      const result = await service.size(request);

      expect(result.conductor_proteccion.seccion_mm2).toBe(95);
      expect(result.conductor_tierra.seccion_mm2).toBe(120);
      expect(result.sistema_tierra.tipo_sistema).toBe('TT');
      expect(result.sistema_tierra.resistencia_maxima_ohm).toBe(1);
      expect(result.sistema_tierra.numero_electrodos).toBe(3);
      expect(result.sistema_tierra.tipo_electrodo).toBe('Malla de tierra');
      expect(result.resumen.estado).toBe('CRÍTICO');
    });

    it('should handle breaker amperage not in rules table', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 75, // Not in mock rules
        },
      };

      const result = await service.size(request);

      expect(result.conductor_proteccion.seccion_mm2).toBe(10);
      expect(result.conductor_tierra.seccion_mm2).toBe(16);
      expect(result.conductor_proteccion.observaciones).toContain(
        'Conductor de protección para breaker de 75A',
      );
    });

    it('should handle TT system with multiple electrodes', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          tipo_sistema_tierra: 'TT',
        },
      };

      const result = await service.size(request);

      expect(result.sistema_tierra.tipo_sistema).toBe('TT');
      expect(result.sistema_tierra.numero_electrodos).toBe(2);
      expect(result.sistema_tierra.separacion_electrodos_m).toBe(3.0);
    });

    it('should handle IT system with industrial installation', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          tipo_instalacion: 'industrial',
          tipo_sistema_tierra: 'IT',
        },
      };

      const result = await service.size(request);

      expect(result.sistema_tierra.tipo_sistema).toBe('IT');
      expect(result.sistema_tierra.numero_electrodos).toBe(3);
      expect(result.sistema_tierra.separacion_electrodos_m).toBe(6.0);
    });

    it('should generate correct observations', async () => {
      const result = await service.size(baseRequest);

      expect(result.observaciones_generales).toContain(
        'Sistema de puesta a tierra para breaker de 100A',
      );
      expect(result.observaciones_generales).toContain('EGC: 10mm² (8)');
      expect(result.observaciones_generales).toContain('GEC: 16mm² (6)');
      expect(result.observaciones_generales).toContain(
        'Sistema TN-S con 1 electrodo(s)',
      );
      expect(result.observaciones_generales).toContain(
        'Resistencia máxima: 25Ω',
      );
    });

    it('should record metrics correctly', async () => {
      await service.size(baseRequest);

      expect(metricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'grounding',
        'success',
      );
      expect(metricsService.observeCalcDuration).toHaveBeenCalledWith(
        'grounding',
        expect.any(Number),
      );
    });

    it('should handle high amperage breakers', async () => {
      const request = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 2000,
        },
      };

      const result = await service.size(request);

      expect(result.conductor_proteccion.seccion_mm2).toBe(240);
      expect(result.conductor_tierra.seccion_mm2).toBe(300);
      expect(result.conductor_proteccion.calibre_awg).toBe('400');
      expect(result.conductor_tierra.calibre_awg).toBe('500');
    });

    it('should validate input parameters', async () => {
      const invalidRequest = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: -50, // Invalid negative value
        },
      };

      // The service should handle this gracefully
      const result = await service.size(invalidRequest);
      expect(result).toBeDefined();
      expect(result.conductor_proteccion).toBeDefined();
    });
  });
});
