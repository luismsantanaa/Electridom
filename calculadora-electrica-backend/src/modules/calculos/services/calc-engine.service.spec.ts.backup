import { Test, TestingModule } from '@nestjs/testing';
import { CalcEngineService } from './calc-engine.service';
import { NormParamService } from './norm-param.service';
import { MetricsService } from '../../metrics/metrics.service';
import { CalcRoomsRequestDto } from '../dtos/calc-rooms-request.dto';

describe('CalcEngineService', () => {
  let service: CalcEngineService;
  let normParamService: jest.Mocked<NormParamService>;
  let metricsService: jest.Mocked<MetricsService>;

  const mockNormParamService = {
    getParamAsNumber: jest.fn(),
    getParam: jest.fn(),
  };

  const mockMetricsService = {
    incrementCalcRuns: jest.fn(),
    observeCalcDuration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalcEngineService,
        {
          provide: NormParamService,
          useValue: mockNormParamService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<CalcEngineService>(CalcEngineService);
    normParamService = module.get(NormParamService);
    metricsService = module.get(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calcByRoom', () => {
    beforeEach(() => {
      normParamService.getParamAsNumber.mockResolvedValue(32.3);
      normParamService.getParam.mockResolvedValue('32.3');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('debería calcular cargas por ambiente correctamente', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [
          { nombre: 'Sala', area_m2: 18 },
          { nombre: 'Cocina', area_m2: 12 },
        ],
        consumos: [
          {
            nombre: 'TV',
            ambiente: 'Sala',
            potencia_w: 140,
            tipo: 'electrodomestico',
          },
          {
            nombre: 'Nevera',
            ambiente: 'Cocina',
            potencia_w: 200,
            tipo: 'electrodomestico',
            fp: 0.95,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes).toHaveLength(2);
      expect(result.ambientes[0].nombre).toBe('Sala');
      expect(result.ambientes[0].carga_va).toBeCloseTo(736.96, 1); // 18 * 32.3 + 140/0.9 = 581.4 + 155.56
      expect(result.ambientes[1].nombre).toBe('Cocina');
      expect(result.ambientes[1].carga_va).toBeCloseTo(598.13, 1); // 12 * 32.3 + 200/0.95 = 387.6 + 210.53
    });

    it('debería manejar configuración de sistema por defecto', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [],
      };

      const result = await service.calcByRoom(request);

      expect(result.totales.tension_v).toBe(120);
      expect(result.totales.phases).toBe(1);
    });

    it('debería manejar configuración de sistema personalizada', async () => {
      const request: CalcRoomsRequestDto = {
        system: { voltage: 240, phases: 3, frequency: 50 },
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [],
      };

      const result = await service.calcByRoom(request);

      expect(result.totales.tension_v).toBe(240);
      expect(result.totales.phases).toBe(3);
    });

    it('debería calcular factor de potencia efectivo correctamente', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga 1',
            ambiente: 'Sala',
            potencia_w: 1000,
            fp: 0.8,
          },
          {
            nombre: 'Carga 2',
            ambiente: 'Sala',
            potencia_w: 500,
            fp: 0.9,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      const sala = result.ambientes[0];
      expect(sala.carga_va).toBeCloseTo(2128.56, 1); // 10*32.3 + 1000/0.8 + 500/0.9 = 323 + 1250 + 555.56
      expect(sala.fp).toBeCloseTo(0.7, 2); // (1000+500)/2128.56
    });

    it('debería manejar consumos sin factor de potencia especificado', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            tipo: 'electrodomestico',
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].carga_va).toBeCloseTo(434.11, 1); // 10*32.3 + 100/0.9 = 323 + 111.11
    });

    it('debería manejar ambientes sin consumos', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 15 }],
        consumos: [],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].carga_va).toBeCloseTo(484.5, 1); // 15 * 32.3
      expect(result.ambientes[0].observaciones).toContain(
        'Solo carga base de iluminación',
      );
    });

    it('debería ignorar consumos de ambientes no definidos', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'AmbienteInexistente',
            potencia_w: 100,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].carga_va).toBeCloseTo(323, 1); // Solo iluminación
    });

    it('debería calcular totales correctamente', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [
          { nombre: 'Sala', area_m2: 10 },
          { nombre: 'Cocina', area_m2: 8 },
        ],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            fp: 0.9,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      const cargaTotal = 10 * 32.3 + 8 * 32.3 + 100 / 0.9;
      expect(result.totales.carga_total_va).toBeCloseTo(cargaTotal, 1);
      expect(result.totales.corriente_total_a).toBeCloseTo(cargaTotal / 120, 1);
    });

    it('debería registrar métricas correctamente', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [],
      };

      await service.calcByRoom(request);

      expect(metricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'rooms',
        'success',
      );
      expect(metricsService.observeCalcDuration).toHaveBeenCalledWith(
        'rooms',
        expect.any(Number),
      );
      expect(metricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'env_total_va',
        'success',
      );
      expect(metricsService.observeCalcDuration).toHaveBeenCalledWith(
        'env_duration_ms',
        expect.any(Number),
      );
    });

    it('debería manejar errores en parámetros normativos', async () => {
      normParamService.getParamAsNumber.mockRejectedValue(
        new Error('Parámetro no encontrado'),
      );

      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [],
      };

      await expect(service.calcByRoom(request)).rejects.toThrow(
        'Parámetro no encontrado',
      );
    });

    it('debería redondear resultados a 2 decimales', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100.123,
            fp: 0.9,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.totales.carga_total_va).toBe(
        Math.round(result.totales.carga_total_va * 100) / 100,
      );
      expect(result.totales.corriente_total_a).toBe(
        Math.round(result.totales.corriente_total_a * 100) / 100,
      );
    });

    it('debería manejar factor de potencia mínimo', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            fp: 0.05, // Muy bajo
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].fp).toBeGreaterThanOrEqual(0.1);
    });

    it('debería manejar factor de potencia máximo', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            fp: 1.5, // Muy alto
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].fp).toBeLessThanOrEqual(1.0);
    });

    it('debería generar observaciones correctas', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            fp: 0.9,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].observaciones).toContain('Iluminación base:');
      expect(result.ambientes[0].observaciones).toContain(
        'Consumos definidos:',
      );
    });

    it('debería manejar múltiples consumos por ambiente', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga 1',
            ambiente: 'Sala',
            potencia_w: 100,
            fp: 0.9,
          },
          {
            nombre: 'Carga 2',
            ambiente: 'Sala',
            potencia_w: 200,
            fp: 0.8,
          },
          {
            nombre: 'Carga 3',
            ambiente: 'Sala',
            potencia_w: 150,
            fp: 0.95,
          },
        ],
      };

      const result = await service.calcByRoom(request);

      const cargaEsperada = 10 * 32.3 + 100 / 0.9 + 200 / 0.8 + 150 / 0.95;
      expect(result.ambientes[0].carga_va).toBeCloseTo(cargaEsperada, 1);
    });

    it('debería manejar área mínima', async () => {
      const request: CalcRoomsRequestDto = {
        superficies: [{ nombre: 'Sala', area_m2: 0.1 }],
        consumos: [],
      };

      const result = await service.calcByRoom(request);

      expect(result.ambientes[0].carga_va).toBeCloseTo(3.23, 2); // 0.1 * 32.3
    });
  });
});
