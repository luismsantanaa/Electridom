import { Test, TestingModule } from '@nestjs/testing';
import { VoltageDropService } from './voltage-drop.service';
import { NormParamService } from './norm-param.service';
import { CircuitoVoltaje, CalculoCaidaTension } from './voltage-drop.service';

describe('VoltageDropService', () => {
  let service: VoltageDropService;
  let mockNormParamService: jest.Mocked<NormParamService>;

  beforeEach(async () => {
    const mockNormParamServiceProvider = {
      provide: NormParamService,
      useValue: {
        getParam: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VoltageDropService, mockNormParamServiceProvider],
    }).compile();

    service = module.get<VoltageDropService>(VoltageDropService);
    mockNormParamService = module.get(NormParamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calcularCaidaTension', () => {
    const circuitoBase: CircuitoVoltaje = {
      id: 'CIRC-001',
      tipo: 'ILU',
      longitud: 50,
      corriente: 10,
      tension: 120,
      material: 'COBRE',
      seccion: 2.5,
      tipoInstalacion: 'TUBO',
      temperatura: 25,
    };

    beforeEach(() => {
      mockNormParamService.getParam.mockResolvedValue(
        JSON.stringify({
          iluminacion: 3,
          tomacorrientes: 5,
          motores: 5,
          alimentadores: 2,
          general: 5,
        }),
      );
    });

    it('should calculate voltage drop for residential lighting circuit', async () => {
      const result = await service.calcularCaidaTension(circuitoBase);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.caidaTension).toBeGreaterThan(0);
      expect(result.caidaPorcentual).toBeGreaterThan(0);
      expect(result.cumpleNorma).toBeDefined();
      expect(result.factorCorreccion).toBeGreaterThan(0);
      expect(result.resistencia).toBeGreaterThan(0);
      expect(result.reactancia).toBeGreaterThan(0);
      expect(result.potenciaPerdida).toBeGreaterThan(0);
      expect(result.recomendaciones).toBeInstanceOf(Array);
    });

    it('should handle circuits with long lengths', async () => {
      const circuitoLargo: CircuitoVoltaje = {
        ...circuitoBase,
        longitud: 150,
        seccion: 4,
      };

      const result = await service.calcularCaidaTension(circuitoLargo);

      expect(result.caidaPorcentual).toBeGreaterThan(circuitoBase.longitud / 50);
      expect(result.cumpleNorma).toBeDefined();
    });

    it('should handle aluminum conductors', async () => {
      const circuitoAluminio: CircuitoVoltaje = {
        ...circuitoBase,
        material: 'ALUMINIO',
        seccion: 6,
      };

      const result = await service.calcularCaidaTension(circuitoAluminio);

      expect(result.circuitoId).toBe('CIRC-001');
             expect(result.circuitoId).toBe('CIRC-001');
      expect(result.caidaTension).toBeGreaterThan(0);
    });

    it('should handle high current circuits', async () => {
      const circuitoAltaCorriente: CircuitoVoltaje = {
        ...circuitoBase,
        corriente: 50,
        seccion: 16,
      };

      const result = await service.calcularCaidaTension(circuitoAltaCorriente);

      expect(result.caidaTension).toBeGreaterThan(0);
      expect(result.potenciaPerdida).toBeGreaterThan(0);
    });

    it('should handle different installation types', async () => {
      const circuitoCanalizacion: CircuitoVoltaje = {
        ...circuitoBase,
        tipoInstalacion: 'CANALIZACION',
      };

      const result = await service.calcularCaidaTension(circuitoCanalizacion);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.reactancia).toBeGreaterThan(0);
    });

    it('should handle temperature variations', async () => {
      const circuitoAltaTemp: CircuitoVoltaje = {
        ...circuitoBase,
        temperatura: 75,
      };

      const result = await service.calcularCaidaTension(circuitoAltaTemp);

      expect(result.factorCorreccion).toBeGreaterThan(1);
      expect(result.resistencia).toBeGreaterThan(0);
    });

    it('should handle different circuit types', async () => {
      const circuitoTomacorriente: CircuitoVoltaje = {
        ...circuitoBase,
        tipo: 'TOM',
      };

      const result = await service.calcularCaidaTension(circuitoTomacorriente);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.cumpleNorma).toBeDefined();
    });

    it('should handle motor circuits', async () => {
      const circuitoMotor: CircuitoVoltaje = {
        ...circuitoBase,
        tipo: 'MOTOR',
        corriente: 25,
        seccion: 10,
      };

      const result = await service.calcularCaidaTension(circuitoMotor);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.caidaPorcentual).toBeGreaterThan(0);
    });

    it('should handle feeder circuits', async () => {
      const circuitoAlimentador: CircuitoVoltaje = {
        ...circuitoBase,
        tipo: 'ALIMENTADOR',
        corriente: 100,
        seccion: 50,
        longitud: 100,
      };

      const result = await service.calcularCaidaTension(circuitoAlimentador);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.cumpleNorma).toBeDefined();
    });

    it('should handle edge cases with very short lengths', async () => {
      const circuitoCorto: CircuitoVoltaje = {
        ...circuitoBase,
        longitud: 1,
      };

      const result = await service.calcularCaidaTension(circuitoCorto);

      expect(result.caidaPorcentual).toBeLessThan(1);
      expect(result.cumpleNorma).toBe(true);
    });

    it('should handle edge cases with maximum voltage drop', async () => {
      const circuitoMaxCaida: CircuitoVoltaje = {
        ...circuitoBase,
        longitud: 200,
        seccion: 1.5,
        corriente: 15,
      };

      const result = await service.calcularCaidaTension(circuitoMaxCaida);

      expect(result.caidaPorcentual).toBeGreaterThan(3);
      expect(result.cumpleNorma).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockNormParamService.getParam.mockRejectedValue(new Error('Database error'));

      const result = await service.calcularCaidaTension(circuitoBase);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.caidaTension).toBeGreaterThan(0);
    });

    it('should handle missing normative parameters', async () => {
             mockNormParamService.getParam.mockResolvedValue('');

      const result = await service.calcularCaidaTension(circuitoBase);

      expect(result.circuitoId).toBe('CIRC-001');
      expect(result.cumpleNorma).toBeDefined();
    });
  });

  describe('calcularCaidaTensionMultiple', () => {
    const circuitos: CircuitoVoltaje[] = [
      {
        id: 'CIRC-001',
        tipo: 'ILU',
        longitud: 50,
        corriente: 10,
        tension: 120,
        material: 'COBRE',
        seccion: 2.5,
        tipoInstalacion: 'TUBO',
        temperatura: 25,
      },
      {
        id: 'CIRC-002',
        tipo: 'TOM',
        longitud: 75,
        corriente: 15,
        tension: 120,
        material: 'COBRE',
        seccion: 4,
        tipoInstalacion: 'TUBO',
        temperatura: 25,
      },
    ];

    beforeEach(() => {
      mockNormParamService.getParam.mockResolvedValue(
        JSON.stringify({
          iluminacion: 3,
          tomacorrientes: 5,
          motores: 5,
          alimentadores: 2,
          general: 5,
        }),
      );
    });

    it('should calculate voltage drop for multiple circuits', async () => {
      const results = await service.calcularCaidaTensionMultiple(circuitos);

      expect(results).toHaveLength(2);
      expect(results[0].circuitoId).toBe('CIRC-001');
      expect(results[1].circuitoId).toBe('CIRC-002');
      expect(results[0].caidaTension).toBeGreaterThan(0);
      expect(results[1].caidaTension).toBeGreaterThan(0);
    });

    it('should handle empty circuit array', async () => {
      const results = await service.calcularCaidaTensionMultiple([]);

      expect(results).toHaveLength(0);
    });

    it('should handle single circuit', async () => {
      const results = await service.calcularCaidaTensionMultiple([circuitos[0]]);

      expect(results).toHaveLength(1);
      expect(results[0].circuitoId).toBe('CIRC-001');
    });
  });
});
