import { Test, TestingModule } from '@nestjs/testing';
import {
  ConductorSizerService,
  ConductorSeleccionado,
  FactoresCorreccion,
} from './conductor-sizer.service';
import { NormParamService } from './norm-param.service';

describe('ConductorSizerService', () => {
  let service: ConductorSizerService;
  let normParamService: jest.Mocked<NormParamService>;

  const mockNormParamService = {
    getParam: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConductorSizerService,
        {
          provide: NormParamService,
          useValue: mockNormParamService,
        },
      ],
    }).compile();

    service = module.get<ConductorSizerService>(ConductorSizerService);
    normParamService = module.get(NormParamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seleccionarConductor', () => {
    it('debería seleccionar conductor de cobre correctamente', async () => {
      // Arrange
      const corrienteDiseño = 25;
      const temperatura = 30;
      const agrupamiento = 1;
      const tipoInstalacion = 'TUBO_EMBUTIDO';
      const tipoAislamion = 'THHN';
      const material = 'COBRE';

      mockNormParamService.getParam.mockResolvedValue(null); // Usar tabla por defecto

      // Act
      const result = await service.seleccionarConductor(
        corrienteDiseño,
        temperatura,
        agrupamiento,
        tipoInstalacion,
        tipoAislamion,
        material,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.calibre).toBe('AWG 10');
      expect(result.calibre).toBe('AWG 10');
      expect(result.ampacidadCorregida).toBeGreaterThanOrEqual(corrienteDiseño);
      expect(result.cumpleNorma).toBe(true);
    });

    it('debería seleccionar conductor de aluminio correctamente', async () => {
      // Arrange
      const corrienteDiseño = 30;
      const material = 'ALUMINIO';

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarConductor(
        corrienteDiseño,
        30,
        1,
        'TUBO_EMBUTIDO',
        'THHN',
        material,
      );

      // Assert
      expect(result.calibre).toBe('AWG 8');
      expect(result.calibre).toBe('AWG 8');
      expect(result.ampacidadCorregida).toBeGreaterThanOrEqual(corrienteDiseño);
    });

    it('debería aplicar factores de corrección por temperatura', async () => {
      // Arrange
      const corrienteDiseño = 20;
      const temperatura = 50; // Temperatura alta

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarConductor(
        corrienteDiseño,
        temperatura,
        1,
        'TUBO_EMBUTIDO',
        'THHN',
        'COBRE',
      );

      // Assert
      expect(result.factoresCorreccion.temperatura).toBeLessThan(1.0);
      expect(result.ampacidadCorregida).toBeLessThan(result.ampacidadBase);
    });

    it('debería aplicar factores de corrección por agrupamiento', async () => {
      // Arrange
      const corrienteDiseño = 20;
      const agrupamiento = 5; // Múltiples conductores

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarConductor(
        corrienteDiseño,
        30,
        agrupamiento,
        'TUBO_EMBUTIDO',
        'THHN',
        'COBRE',
      );

      // Assert
      expect(result.factoresCorreccion.agrupamiento).toBeLessThan(1.0);
      expect(result.ampacidadCorregida).toBeLessThan(result.ampacidadBase);
    });

    it('debería manejar errores correctamente usando valores por defecto', async () => {
      // Arrange
      mockNormParamService.getParam.mockRejectedValue(
        new Error('Error de base de datos'),
      );

      // Act
      const result = await service.seleccionarConductor(25);

      // Assert
      expect(result).toBeDefined();
      expect(result.calibre).toBeDefined();
      expect(result.ampacidadCorregida).toBeGreaterThanOrEqual(25);
      // Verificar que se completó la selección a pesar del error
      expect(result.cumpleNorma).toBe(true);
    });
  });

  describe('obtenerTablaConductores', () => {
    it('debería usar tabla por defecto cuando no hay datos en BD', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerTablaConductores(
        'COBRE',
        [],
      );

      // Assert
      expect(result).toHaveLength(12); // Tabla por defecto de cobre
      expect(result[0].calibre).toBe('AWG 14');
      expect(result[11].calibre).toBe('AWG 4/0');
    });

    it('debería usar tabla de BD cuando está disponible', async () => {
      // Arrange
      const tablaBD = {
        COBRE: [
          {
            calibre: 'AWG 12',
            seccionMM2: 3.31,
            ampacidadBase: 25,
            ampacidadCorregida: 25,
            temperatura: 30,
            agrupamiento: 1,
            tipoAislamiento: 'THHN',
            material: 'COBRE',
          },
        ],
      };
      mockNormParamService.getParam.mockResolvedValue(JSON.stringify(tablaBD));

      // Act
      const result = await (service as any).obtenerTablaConductores(
        'COBRE',
        [],
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].calibre).toBe('AWG 12');
    });
  });

  describe('obtenerTablaConductoresDefault', () => {
    it('debería devolver tabla de cobre por defecto', () => {
      // Act
      const result = (service as any).obtenerTablaConductoresDefault('COBRE');

      // Assert
      expect(result).toHaveLength(12);
      expect(result.every((c) => c.material === 'COBRE')).toBe(true);
      expect(result[0].calibre).toBe('AWG 14');
      expect(result[0].ampacidadBase).toBe(20);
    });

    it('debería devolver tabla de aluminio por defecto', () => {
      // Act
      const result = (service as any).obtenerTablaConductoresDefault(
        'ALUMINIO',
      );

      // Assert
      expect(result).toHaveLength(11);
      expect(result.every((c) => c.material === 'ALUMINIO')).toBe(true);
      expect(result[0].calibre).toBe('AWG 12');
      expect(result[0].ampacidadBase).toBe(20);
    });
  });

  describe('calcularFactoresCorreccion', () => {
    it('debería calcular todos los factores correctamente', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).calcularFactoresCorreccion(
        30, // temperatura
        2, // agrupamiento
        'TUBO_EMBUTIDO',
        'THHN',
        [],
      );

      // Assert
      expect(result.temperatura).toBe(1.0);
      expect(result.agrupamiento).toBe(0.8);
      expect(result.tipoInstalacion).toBe(0.8);
      expect(result.tipoAislamiento).toBe(1.0);
    });
  });

  describe('calcularFactorTemperatura', () => {
    it('debería aplicar factor 1.0 para temperatura estándar', () => {
      // Act
      const result = (service as any).calcularFactorTemperatura(30);

      // Assert
      expect(result).toBe(1.0);
    });

    it('debería aplicar factor de reducción para temperatura alta', () => {
      // Act
      const result = (service as any).calcularFactorTemperatura(60);

      // Assert
      expect(result).toBe(0.71);
    });

    it('debería aplicar factor de aumento para temperatura baja', () => {
      // Act
      const result = (service as any).calcularFactorTemperatura(20);

      // Assert
      expect(result).toBe(1.08);
    });

    it('debería manejar temperatura fuera de rango', () => {
      // Act
      const result = (service as any).calcularFactorTemperatura(100);

      // Assert
      // Para temperatura 100°C, debería usar el factor más bajo disponible
      expect(result).toBe(0.25);
    });
  });

  describe('calcularFactorAgrupamiento', () => {
    it('debería aplicar factor 1.0 para un conductor', () => {
      // Act
      const result = (service as any).calcularFactorAgrupamiento(1);

      // Assert
      expect(result).toBe(1.0);
    });

    it('debería aplicar factor de reducción para múltiples conductores', () => {
      // Act
      const result = (service as any).calcularFactorAgrupamiento(5);

      // Assert
      expect(result).toBe(0.6);
    });

    it('debería manejar agrupamiento extremo', () => {
      // Act
      const result = (service as any).calcularFactorAgrupamiento(25);

      // Assert
      expect(result).toBe(0.34);
    });
  });

  describe('obtenerFactorTipoInstalacion', () => {
    it('debería usar factores de BD cuando están disponibles', async () => {
      // Arrange
      const factores = {
        TUBO_EMBUTIDO: 0.75,
        TUBO_VISTO: 0.9,
      };
      mockNormParamService.getParam.mockResolvedValue(JSON.stringify(factores));

      // Act
      const result = await (service as any).obtenerFactorTipoInstalacion(
        'TUBO_EMBUTIDO',
        [],
      );

      // Assert
      expect(result).toBe(0.75);
    });

    it('debería usar factores por defecto cuando no hay BD', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerFactorTipoInstalacion(
        'TUBO_EMBUTIDO',
        [],
      );

      // Assert
      expect(result).toBe(0.8);
    });

    it('debería usar factor por defecto para tipo desconocido', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerFactorTipoInstalacion(
        'TIPO_DESCONOCIDO',
        [],
      );

      // Assert
      expect(result).toBe(0.8);
    });
  });

  describe('obtenerFactorTipoAislamion', () => {
    it('debería usar factores de BD cuando están disponibles', async () => {
      // Arrange
      const factores = {
        THHN: 0.95,
        THW: 0.85,
      };
      mockNormParamService.getParam.mockResolvedValue(JSON.stringify(factores));

      // Act
      const result = await (service as any).obtenerFactorTipoAislamion(
        'THHN',
        [],
      );

      // Assert
      expect(result).toBe(0.95);
    });

    it('debería usar factores por defecto cuando no hay BD', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerFactorTipoAislamion(
        'THHN',
        [],
      );

      // Assert
      expect(result).toBe(1.0);
    });
  });

  describe('seleccionarConductorApropiado', () => {
    it('debería seleccionar conductor apropiado para corriente de diseño', () => {
      // Arrange
      const tablaConductores = [
        {
          calibre: 'AWG 14',
          seccionMM2: 2.08,
          ampacidadBase: 20,
          ampacidadCorregida: 20,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 12',
          seccionMM2: 3.31,
          ampacidadBase: 25,
          ampacidadCorregida: 25,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 10',
          seccionMM2: 5.26,
          ampacidadBase: 35,
          ampacidadCorregida: 35,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
      ];

      const factores: FactoresCorreccion = {
        temperatura: 1.0,
        agrupamiento: 1.0,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).seleccionarConductorApropiado(
        tablaConductores,
        30, // corriente de diseño
        factores,
      );

      // Assert
      expect(result.calibre).toBe('AWG 10');
      expect(result.ampacidadCorregida).toBe(35);
    });

    it('debería devolver conductor más grande si no hay uno apropiado', () => {
      // Arrange
      const tablaConductores = [
        {
          calibre: 'AWG 14',
          seccionMM2: 2.08,
          ampacidadBase: 20,
          ampacidadCorregida: 20,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
      ];

      const factores: FactoresCorreccion = {
        temperatura: 1.0,
        agrupamiento: 1.0,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).seleccionarConductorApropiado(
        tablaConductores,
        50, // corriente de diseño mayor que la disponible
        factores,
      );

      // Assert
      expect(result.calibre).toBe('AWG 14');
    });
  });

  describe('validarSeleccionConductor', () => {
    it('debería validar selección correcta', () => {
      // Arrange
      const conductor = {
        calibre: 'AWG 10',
        ampacidadCorregida: 35,
      };

      const factores: FactoresCorreccion = {
        temperatura: 1.0,
        agrupamiento: 1.0,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).validarSeleccionConductor(
        conductor,
        25, // corriente de diseño
        factores,
      );

      // Assert
      expect(result.cumpleNorma).toBe(true);
      expect(result.margenSeguridad).toBe(40); // (35-25)/25 * 100
      expect(result.recomendaciones).toHaveLength(0);
    });

    it('debería generar recomendaciones para margen bajo', () => {
      // Arrange
      const conductor = {
        calibre: 'AWG 12',
        ampacidadCorregida: 26,
      };

      const factores: FactoresCorreccion = {
        temperatura: 1.0,
        agrupamiento: 1.0,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).validarSeleccionConductor(
        conductor,
        25, // corriente de diseño
        factores,
      );

      // Assert
      expect(result.cumpleNorma).toBe(true);
      expect(result.margenSeguridad).toBe(4); // (26-25)/25 * 100
      expect(result.recomendaciones).toContain(
        'Considerar conductor de calibre superior para mayor margen de seguridad',
      );
    });

    it('debería generar recomendaciones para factores bajos', () => {
      // Arrange
      const conductor = {
        calibre: 'AWG 10',
        ampacidadCorregida: 35,
      };

      const factores: FactoresCorreccion = {
        temperatura: 0.7,
        agrupamiento: 0.6,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).validarSeleccionConductor(
        conductor,
        25,
        factores,
      );

      // Assert
      expect(result.recomendaciones).toContain(
        'Atención: Factor de temperatura bajo, verificar condiciones de instalación',
      );
      expect(result.recomendaciones).toContain(
        'Atención: Factor de agrupamiento bajo, considerar separación de conductores',
      );
    });

    it('debería generar recomendación para conductor sobredimensionado', () => {
      // Arrange
      const conductor = {
        calibre: 'AWG 6',
        ampacidadCorregida: 100,
      };

      const factores: FactoresCorreccion = {
        temperatura: 1.0,
        agrupamiento: 1.0,
        tipoInstalacion: 1.0,
        tipoAislamiento: 1.0,
      };

      // Act
      const result = (service as any).validarSeleccionConductor(
        conductor,
        25,
        factores,
      );

      // Assert
      expect(result.recomendaciones).toContain(
        'Conductor sobredimensionado, considerar calibre inferior para optimización de costos',
      );
    });
  });
});
