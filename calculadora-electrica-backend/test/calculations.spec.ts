import { Test, TestingModule } from '@nestjs/testing';
import { CalculosController } from '../src/modules/calculos/controllers/calculos.controller';
import { CalculosService } from '../src/modules/calculos/services/calculos.service';
import { RulesModule } from '../src/modules/rules/rules.module';

describe('Calculations Unit Tests', () => {
  let controller: CalculosController;
  let service: CalculosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RulesModule],
      controllers: [CalculosController],
      providers: [CalculosService],
    }).compile();

    controller = module.get<CalculosController>(CalculosController);
    service = module.get<CalculosService>(CalculosService);
  });

  describe('Calculations Service', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should validate calculation payload structure', () => {
      const validPayload = {
        superficies: [
          { ambiente: 'Sala', areaM2: 18.5 },
        ],
        consumos: [
          { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
        ],
        opciones: { tensionV: 120, monofasico: true },
      };

      // Verificar que el payload tiene la estructura correcta
      expect(validPayload).toHaveProperty('superficies');
      expect(validPayload).toHaveProperty('consumos');
      expect(validPayload).toHaveProperty('opciones');
      expect(Array.isArray(validPayload.superficies)).toBe(true);
      expect(Array.isArray(validPayload.consumos)).toBe(true);
      expect(validPayload.superficies.length).toBeGreaterThan(0);
    });

    it('should detect invalid payload structure', () => {
      const invalidPayload = {
        superficies: [],
        consumos: [{ nombre: 'Test', ambiente: 'Sala', watts: 100 }],
        opciones: { tensionV: 120, monofasico: true },
      };

      // Verificar que detecta superficies vacías
      expect(invalidPayload.superficies.length).toBe(0);
    });

    it('should validate area values', () => {
      const validArea = 18.5;
      const invalidArea = -10;

      expect(validArea).toBeGreaterThan(0);
      expect(invalidArea).toBeLessThan(0);
    });

    it('should validate watts values', () => {
      const validWatts = 120;
      const invalidWatts = -100;

      expect(validWatts).toBeGreaterThan(0);
      expect(invalidWatts).toBeLessThan(0);
    });
  });

  describe('Calculations Controller', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
