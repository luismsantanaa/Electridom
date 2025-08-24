import { Test, TestingModule } from '@nestjs/testing';
import { CalculationDomainService } from '../../src/modules/calculos/services/calculation-domain.service';
import { RuleProviderService } from '../../src/modules/rules/rule-provider.service';
import { PreviewRequestDto } from '../../src/modules/calculos/dtos/preview.request.dto';

describe('CalculationDomainService', () => {
  let service: CalculationDomainService;

  const mockRuleProvider = {
    getNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculationDomainService,
        {
          provide: RuleProviderService,
          useValue: mockRuleProvider,
        },
      ],
    }).compile();

    service = module.get<CalculationDomainService>(CalculationDomainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calcularPreview', () => {
    const mockRequest: PreviewRequestDto = {
      superficies: [
        { ambiente: 'Sala', areaM2: 18.5 },
        { ambiente: 'Dormitorio 1', areaM2: 12.0 },
      ],
      consumos: [
        { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
        { nombre: 'Lámpara', ambiente: 'Dormitorio 1', watts: 60 },
      ],
      opciones: { tensionV: 120, monofasico: true },
    };

    beforeEach(() => {
      // Mock reglas por defecto
      mockRuleProvider.getNumber.mockImplementation((code: string) => {
        const rules = {
          LUZ_VA_POR_M2: 100,
          FACTOR_DEMANDA_LUZ: 1.0,
          FACTOR_DEMANDA_TOMA: 1.0,
          FACTOR_DEMANDA_CARGAS_FIJAS: 1.0,
          ILU_VA_MAX_POR_CIRCUITO: 1440,
          TOMA_VA_MAX_POR_CIRCUITO: 1800,
        };
        return Promise.resolve(rules[code] || 1.0);
      });
    });

    it('should calculate preview successfully', async () => {
      const warnings: string[] = [];
      const result = await service.calcularPreview(mockRequest, warnings);

      expect(result.cargasPorAmbiente).toHaveLength(2);
      expect(result.totales.totalConectadaVA).toBeGreaterThan(0);
      expect(result.totales.demandaEstimadaVA).toBeGreaterThan(0);
      expect(result.propuestaCircuitos.length).toBeGreaterThan(0);
      expect(result.warnings).toBe(warnings);
    });

    it('should calculate correct loads by environment', async () => {
      const warnings: string[] = [];
      const result = await service.calcularPreview(mockRequest, warnings);

      const sala = result.cargasPorAmbiente.find((c) => c.ambiente === 'Sala')!;
      const dormitorio = result.cargasPorAmbiente.find(
        (c) => c.ambiente === 'Dormitorio 1',
      )!;

      expect(sala.iluminacionVA).toBe(1850); // 18.5 * 100
      expect(sala.tomasVA).toBe(120); // 120 watts
      expect(dormitorio.iluminacionVA).toBe(1200); // 12.0 * 100
      expect(dormitorio.tomasVA).toBe(60); // 60 watts
    });

    it('should throw error for duplicate environments', async () => {
      const invalidRequest = {
        ...mockRequest,
        superficies: [
          { ambiente: 'Sala', areaM2: 18.5 },
          { ambiente: 'Sala', areaM2: 12.0 }, // Duplicado
        ],
      };

      const warnings: string[] = [];
      await expect(
        service.calcularPreview(invalidRequest as PreviewRequestDto, warnings),
      ).rejects.toThrow("El ambiente 'Sala' está duplicado");
    });

    it('should throw error for consumption in non-existent environment', async () => {
      const invalidRequest = {
        ...mockRequest,
        consumos: [
          { nombre: 'Televisor', ambiente: 'Cocina', watts: 120 }, // Ambiente inexistente
        ],
      };

      const warnings: string[] = [];
      await expect(
        service.calcularPreview(invalidRequest as PreviewRequestDto, warnings),
      ).rejects.toThrow(
        "El ambiente 'Cocina' no existe para el consumo 'Televisor'",
      );
    });

    it('should handle factorUso in consumptions', async () => {
      const requestWithFactorUso = {
        ...mockRequest,
        consumos: [
          { nombre: 'Televisor', ambiente: 'Sala', watts: 120, factorUso: 0.8 },
        ],
      };

      const warnings: string[] = [];
      const result = await service.calcularPreview(
        requestWithFactorUso as PreviewRequestDto,
        warnings,
      );

      const sala = result.cargasPorAmbiente.find((c) => c.ambiente === 'Sala')!;
      expect(sala.tomasVA).toBe(96); // 120 * 0.8
    });
  });

  describe('rule provider integration', () => {
    it('should use fallback values when rules are not found', async () => {
      const warnings: string[] = [];
      mockRuleProvider.getNumber.mockResolvedValue(undefined);

      const request: PreviewRequestDto = {
        superficies: [{ ambiente: 'Sala', areaM2: 10 }],
        consumos: [],
        opciones: { tensionV: 120, monofasico: true },
      };

      await expect(service.calcularPreview(request, warnings)).rejects.toThrow(
        'Regla LUZ_VA_POR_M2 no encontrada y no se proporcionó valor por defecto',
      );
    });
  });
});
