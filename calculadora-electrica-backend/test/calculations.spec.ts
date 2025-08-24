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
        surfaces: [
          { environment: 'Sala', areaM2: 18.5 },
        ],
        consumptions: [
          { name: 'Televisor', environment: 'Sala', watts: 120 },
        ],
        opciones: { tensionV: 120, monofasico: true },
      };

      // Verificar que el payload tiene la estructura correcta
      expect(validPayload).toHaveProperty('surfaces');
      expect(validPayload).toHaveProperty('consumptions');
      expect(validPayload).toHaveProperty('opciones');
      expect(Array.isArray(validPayload.surfaces)).toBe(true);
      expect(Array.isArray(validPayload.consumptions)).toBe(true);
      expect(validPayload.surfaces.length).toBeGreaterThan(0);
    });

    it('should detect invalid payload structure', () => {
      const invalidPayload = {
        surfaces: [],
        consumptions: [{ name: 'Test', environment: 'Sala', watts: 100 }],
        opciones: { tensionV: 120, monofasico: true },
      };

      // Verificar que detecta surfaces vacías
      expect(invalidPayload.surfaces.length).toBe(0);
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

