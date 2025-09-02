import { Test, TestingModule } from '@nestjs/testing';
import {
  ProtectionSelectorService,
  ProteccionSeleccionada,
  CriteriosSeleccion,
} from './protection-selector.service';
import { NormParamService } from './norm-param.service';

describe('ProtectionSelectorService', () => {
  let service: ProtectionSelectorService;
  let normParamService: jest.Mocked<NormParamService>;

  const mockNormParamService = {
    getParam: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtectionSelectorService,
        {
          provide: NormParamService,
          useValue: mockNormParamService,
        },
      ],
    }).compile();

    service = module.get<ProtectionSelectorService>(ProtectionSelectorService);
    normParamService = module.get(NormParamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seleccionarProteccion', () => {
    it('debería seleccionar protección MCB correctamente', async () => {
      // Arrange
      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 25,
        tipoCircuito: 'TOM',
        ambiente: 'COCINA',
        uso: 'TOMACORRIENTES_COCINA',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      mockNormParamService.getParam.mockResolvedValue(null); // Usar reglas por defecto

      // Act
      const result = await service.seleccionarProteccion(criterios);

      // Assert
      expect(result).toBeDefined();
      expect(result.proteccion.tipo).toBe('MCB');
      expect(result.proteccion.amperaje).toBe(32); // 25 * 1.25 = 31.25 -> 32
      expect(result.curva).toBe('C');
      expect(result.banderas.gfci).toBe(true); // COCINA requiere GFCI
      expect(result.cumpleNorma).toBe(true);
    });

    it('debería seleccionar protección MCCB para corrientes altas', async () => {
      // Arrange
      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 100,
        tipoCircuito: 'TUE',
        ambiente: 'GARAGE',
        uso: 'COMPRESOR_AIRE',
        tension: 240,
        corrienteCortocircuito: 15000,
      };

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarProteccion(criterios);

      // Assert
      expect(result.proteccion.tipo).toBe('MCCB');
      expect(result.proteccion.amperaje).toBe(125); // 100 * 1.25 = 125
      expect(result.curva).toBe('D'); // TUE usa curva D
    });

    it('debería aplicar banderas GFCI para baños', async () => {
      // Arrange
      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 20,
        tipoCircuito: 'TOM',
        ambiente: 'BANO',
        uso: 'TOMACORRIENTES_BANO',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarProteccion(criterios);

      // Assert
      expect(result.banderas.gfci).toBe(true);
      expect(result.banderas.rcd).toBe(true);
      expect(result.banderas.afci).toBe(false);
    });

    it('debería aplicar banderas AFCI para dormitorios', async () => {
      // Arrange
      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 15,
        tipoCircuito: 'ILU',
        ambiente: 'DORMITORIO',
        uso: 'ILUMINACION_DORMITORIO',
        tension: 120,
        corrienteCortocircuito: 3000,
      };

      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await service.seleccionarProteccion(criterios);

      // Assert
      expect(result.banderas.afci).toBe(true);
      expect(result.banderas.gfci).toBe(false);
      expect(result.curva).toBe('B'); // ILU usa curva B
    });

    it('debería manejar errores correctamente usando valores por defecto', async () => {
      // Arrange
      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 25,
        tipoCircuito: 'TOM',
        ambiente: 'COCINA',
        uso: 'TOMACORRIENTES_COCINA',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      mockNormParamService.getParam.mockRejectedValue(
        new Error('Error de base de datos'),
      );

      // Act
      const result = await service.seleccionarProteccion(criterios);

      // Assert
      expect(result).toBeDefined();
      expect(result.proteccion).toBeDefined();
      expect(result.banderas).toBeDefined();
      // Verificar que se completó la selección a pesar del error
      expect(result.proteccion.amperaje).toBe(32);
      expect(result.curva).toBe('C');
    });
  });

  describe('obtenerReglasProteccion', () => {
    it('debería usar reglas por defecto cuando no hay BD', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerReglasProteccion([]);

      // Assert
      expect(result.gfci).toContain('BANOS');
      expect(result.gfci).toContain('COCINAS');
      expect(result.afci).toContain('DORMITORIOS');
      expect(result.curvasRecomendadas.ILU).toBe('B');
      expect(result.curvasRecomendadas.TOM).toBe('C');
    });

    it('debería usar reglas de BD cuando están disponibles', async () => {
      // Arrange
      const reglasBD = {
        gfci: ['BAÑO', 'COCINA'],
        afci: ['DORMITORIO'],
        rcd: ['BAÑO'],
        spd: ['PANEL'],
        curvasRecomendadas: { ILU: 'A', TOM: 'B' },
        factoresSeguridad: { ILU: 1.5, TOM: 2.0 },
      };
      mockNormParamService.getParam.mockResolvedValue(JSON.stringify(reglasBD));

      // Act
      const result = await (service as any).obtenerReglasProteccion([]);

      // Assert
      expect(result.gfci).toContain('BAÑO');
      expect(result.curvasRecomendadas.ILU).toBe('A');
    });
  });

  describe('obtenerReglasProteccionDefault', () => {
    it('debería devolver reglas por defecto completas', () => {
      // Act
      const result = (service as any).obtenerReglasProteccionDefault();

      // Assert
      expect(result.gfci).toContain('BANOS');
      expect(result.gfci).toContain('COCINAS');
      expect(result.afci).toContain('DORMITORIOS');
      expect(result.rcd).toContain('BANOS');
      expect(result.curvasRecomendadas.ILU).toBe('B');
      expect(result.factoresSeguridad.ILU).toBe(1.25);
    });
  });

  describe('seleccionarProteccionBase', () => {
    it('debería seleccionar protección base correctamente', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).seleccionarProteccionBase(
        25,
        120,
        [],
      );

      // Assert
      expect(result.tipo).toBe('MCB');
      expect(result.amperaje).toBe(32);
      expect(result.corrienteInterruptora).toBe(320);
    });
  });

  describe('obtenerCatalogoProtecciones', () => {
    it('debería usar catálogo por defecto cuando no hay BD', async () => {
      // Arrange
      mockNormParamService.getParam.mockResolvedValue(null);

      // Act
      const result = await (service as any).obtenerCatalogoProtecciones([]);

      // Assert
      expect(result).toHaveLength(34); // Catálogo por defecto actualizado
      expect(result.some((p) => p.tipo === 'MCB' && p.amperaje === 15)).toBe(
        true,
      );
      expect(result.some((p) => p.tipo === 'MCCB' && p.amperaje === 400)).toBe(
        true,
      );
    });

    it('debería usar catálogo de BD cuando está disponible', async () => {
      // Arrange
      const catalogoBD = [
        {
          tipo: 'MCB',
          amperaje: 20,
          curva: 'C',
          polo: '1P',
          caracteristicas: ['C', '1P'],
          precioEstimado: 30,
        },
      ];
      mockNormParamService.getParam.mockResolvedValue(
        JSON.stringify(catalogoBD),
      );

      // Act
      const result = await (service as any).obtenerCatalogoProtecciones([]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].amperaje).toBe(20);
    });
  });

  describe('obtenerCatalogoProteccionesDefault', () => {
    it('debería devolver catálogo completo por defecto', () => {
      // Act
      const result = (service as any).obtenerCatalogoProteccionesDefault();

      // Assert
      expect(result).toHaveLength(34);

      // Verificar MCB 1P Curva B
      const mcb15b = result.find(
        (p) => p.tipo === 'MCB' && p.amperaje === 15 && p.curva === 'B',
      );
      expect(mcb15b).toBeDefined();
      expect(mcb15b?.polo).toBe('1P');
      expect(mcb15b?.precioEstimado).toBe(25);

      // Verificar MCB 1P Curva C
      const mcb20c = result.find(
        (p) => p.tipo === 'MCB' && p.amperaje === 20 && p.curva === 'C',
      );
      expect(mcb20c).toBeDefined();
      expect(mcb20c?.precioEstimado).toBe(28);

      // Verificar MCCB
      const mccb100 = result.find(
        (p) => p.tipo === 'MCCB' && p.amperaje === 100,
      );
      expect(mccb100).toBeDefined();
      expect(mccb100?.polo).toBe('3P');
      expect(mccb100?.precioEstimado).toBe(150);
    });
  });

  describe('calcularCorrienteNominal', () => {
    it('debería calcular corriente nominal con factor de seguridad', () => {
      // Act
      const result = (service as any).calcularCorrienteNominal(20, 120);

      // Assert
      expect(result).toBe(25); // 20 * 1.25 = 25
    });

    it('debería redondear al amperaje estándar más cercano', () => {
      // Act
      const result = (service as any).calcularCorrienteNominal(18, 120);

      // Assert
      expect(result).toBe(20); // 18 * 1.25 = 22.5 -> 25
    });

    it('debería manejar corrientes altas', () => {
      // Act
      const result = (service as any).calcularCorrienteNominal(800, 240);

      // Assert
      expect(result).toBe(1000); // 800 * 1.25 = 1000, redondeado al estándar más cercano
    });
  });

  describe('buscarProteccionApropiada', () => {
    it('debería seleccionar protección apropiada por precio', () => {
      // Arrange
      const catalogo = [
        {
          tipo: 'MCB',
          amperaje: 20,
          curva: 'B',
          polo: '1P',
          caracteristicas: ['B', '1P'],
          precioEstimado: 30,
        },
        {
          tipo: 'MCB',
          amperaje: 25,
          curva: 'B',
          polo: '1P',
          caracteristicas: ['B', '1P'],
          precioEstimado: 25,
        },
        {
          tipo: 'MCB',
          amperaje: 32,
          curva: 'B',
          polo: '1P',
          caracteristicas: ['B', '1P'],
          precioEstimado: 35,
        },
      ];

      // Act
      const result = (service as any).buscarProteccionApropiada(catalogo, 22);

      // Assert
      expect(result.amperaje).toBe(25); // Debería seleccionar el más económico (25)
      expect(result.corrienteInterruptora).toBe(250);
    });

    it('debería devolver la protección más grande si no hay una apropiada', () => {
      // Arrange
      const catalogo = [
        {
          tipo: 'MCB',
          amperaje: 15,
          curva: 'B',
          polo: '1P',
          caracteristicas: ['B', '1P'],
          precioEstimado: 25,
        },
      ];

      // Act
      const result = (service as any).buscarProteccionApropiada(catalogo, 50);

      // Assert
      expect(result.amperaje).toBe(15);
      expect(result.corrienteInterruptora).toBe(150);
    });
  });

  describe('determinarCurva', () => {
    it('debería usar curva recomendada por tipo de circuito', () => {
      // Arrange
      const curvasRecomendadas = {
        ILU: 'B',
        TOM: 'C',
        IUG: 'C',
      };

      // Act & Assert
      expect(
        (service as any).determinarCurva(
          'ILU',
          'ILUMINACION',
          curvasRecomendadas,
        ),
      ).toBe('B');
      expect(
        (service as any).determinarCurva(
          'TOM',
          'TOMACORRIENTES',
          curvasRecomendadas,
        ),
      ).toBe('C');
    });

    it('debería usar curva D para cargas con alta corriente de arranque', () => {
      // Arrange
      const curvasRecomendadas = {};

      // Act & Assert
      expect(
        (service as any).determinarCurva(
          'TOM',
          'MOTOR_COMPRESOR',
          curvasRecomendadas,
        ),
      ).toBe('D');
      expect(
        (service as any).determinarCurva(
          'IUG',
          'COMPRESOR_AIRE',
          curvasRecomendadas,
        ),
      ).toBe('D');
    });

    it('debería usar curva B para cargas sensibles', () => {
      // Arrange
      const curvasRecomendadas = {};

      // Act & Assert
      expect(
        (service as any).determinarCurva(
          'ILU',
          'ILUMINACION_LED',
          curvasRecomendadas,
        ),
      ).toBe('B');
      expect(
        (service as any).determinarCurva(
          'TOM',
          'SENALIZACION',
          curvasRecomendadas,
        ),
      ).toBe('B');
    });

    it('debería usar curva C como estándar', () => {
      // Arrange
      const curvasRecomendadas = {};

      // Act & Assert
      expect(
        (service as any).determinarCurva(
          'TOM',
          'TOMACORRIENTES_GENERAL',
          curvasRecomendadas,
        ),
      ).toBe('C');
    });
  });

  describe('aplicarBanderasProteccion', () => {
    it('debería aplicar banderas GFCI para ambientes húmedos', () => {
      // Arrange
      const reglas = {
        gfci: ['BANO', 'COCINAS', 'LAVADEROS'],
        afci: ['DORMITORIOS'],
        rcd: ['BANO'],
        spd: ['PANEL_PRINCIPAL'],
      };

      // Act
      const result = (service as any).aplicarBanderasProteccion(
        'BANO',
        'TOMACORRIENTES',
        reglas,
      );

      // Debug
      console.log('Debug - Ambiente: BANO, Reglas GFCI:', reglas.gfci);
      console.log('Debug - Result:', result);

      // Assert
      expect(result.gfci).toBe(true);
      expect(result.rcd).toBe(true);
      expect(result.afci).toBe(false);
      expect(result.spd).toBe(false);
    });

    it('debería aplicar banderas AFCI para áreas de dormir', () => {
      // Arrange
      const reglas = {
        gfci: ['BANOS'],
        afci: ['DORMITORIOS', 'SALAS'],
        rcd: ['BANOS'],
        spd: ['PANEL_PRINCIPAL'],
      };

      // Act
      const result = (service as any).aplicarBanderasProteccion(
        'DORMITORIO',
        'ILUMINACION',
        reglas,
      );

      // Assert
      expect(result.afci).toBe(true);
      expect(result.gfci).toBe(false);
      expect(result.rcd).toBe(false);
    });

    it('debería aplicar banderas SPD para equipos críticos', () => {
      // Arrange
      const reglas = {
        gfci: ['BANOS'],
        afci: ['DORMITORIOS'],
        rcd: ['BANOS'],
        spd: ['PANEL_PRINCIPAL', 'EQUIPOS_SENSIBLES'],
      };

      // Act
      const result = (service as any).aplicarBanderasProteccion(
        'PANEL_PRINCIPAL',
        'ALIMENTADOR',
        reglas,
      );

      // Assert
      expect(result.spd).toBe(true);
    });
  });

  describe('validarSeleccionProteccion', () => {
    it('debería validar protección que cumple norma', () => {
      // Arrange
      const proteccion = {
        amperaje: 32,
        corrienteInterruptora: 320,
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
      };

      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 25,
        tipoCircuito: 'TOM',
        ambiente: 'COCINA',
        uso: 'TOMACORRIENTES',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      const banderas = { gfci: true, afci: false, rcd: false, spd: false };
      const reglas = { gfci: ['COCINAS'], afci: [], rcd: [], spd: [] };

      // Act
      const result = (service as any).validarSeleccionProteccion(
        proteccion,
        criterios,
        banderas,
        reglas,
      );

      // Assert
      expect(result.cumpleNorma).toBe(true);
      expect(result.recomendaciones).toHaveLength(0);
    });

    it('debería generar recomendaciones para protección insuficiente', () => {
      // Arrange
      const proteccion = {
        amperaje: 15,
        corrienteInterruptora: 150,
        caracteristicas: ['B', '1P'],
      };

      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 25,
        tipoCircuito: 'TOM',
        ambiente: 'COCINA',
        uso: 'TOMACORRIENTES',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      const banderas = { gfci: true, afci: false, rcd: false, spd: false };
      const reglas = { gfci: ['COCINAS'], afci: [], rcd: [], spd: [] };

      // Act
      const result = (service as any).validarSeleccionProteccion(
        proteccion,
        criterios,
        banderas,
        reglas,
      );

      // Assert
      expect(result.cumpleNorma).toBe(false);
      expect(result.recomendaciones).toContain(
        'La protección seleccionada no cumple con la corriente de diseño',
      );
    });

    it('debería generar recomendaciones para protección sobredimensionada', () => {
      // Arrange
      const proteccion = {
        amperaje: 63,
        corrienteInterruptora: 630,
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
      };

      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 25,
        tipoCircuito: 'TOM',
        ambiente: 'COCINA',
        uso: 'TOMACORRIENTES',
        tension: 120,
        corrienteCortocircuito: 5000,
      };

      const banderas = { gfci: true, afci: false, rcd: false, spd: false };
      const reglas = { gfci: ['COCINAS'], afci: [], rcd: [], spd: [] };

      // Act
      const result = (service as any).validarSeleccionProteccion(
        proteccion,
        criterios,
        banderas,
        reglas,
      );

      // Assert
      expect(result.cumpleNorma).toBe(true);
      expect(result.recomendaciones).toContain(
        'Considerar protección de menor amperaje para optimización de costos',
      );
    });

    it('debería generar recomendación para usar MCCB en corrientes altas', () => {
      // Arrange
      const proteccion = {
        amperaje: 80,
        corrienteInterruptora: 800,
        caracteristicas: ['D', '1P'],
        tipo: 'MCB',
      };

      const criterios: CriteriosSeleccion = {
        corrienteDiseño: 70,
        tipoCircuito: 'TUE',
        ambiente: 'GARAGE',
        uso: 'COMPRESOR',
        tension: 240,
        corrienteCortocircuito: 15000,
      };

      const banderas = { gfci: false, afci: false, rcd: false, spd: false };
      const reglas = { gfci: [], afci: [], rcd: [], spd: [] };

      // Act
      const result = (service as any).validarSeleccionProteccion(
        proteccion,
        criterios,
        banderas,
        reglas,
      );

      // Assert
      expect(result.recomendaciones).toContain(
        'Considerar MCCB para corrientes superiores a 63A',
      );
    });
  });

  describe('calcularFactorSeguridad', () => {
    it('debería calcular factor de seguridad correctamente', () => {
      // Act
      const result = (service as any).calcularFactorSeguridad(320, 25);

      // Assert
      expect(result).toBe(12.8); // 320 / 25 = 12.8
    });

    it('debería manejar corriente de diseño cero', () => {
      // Act
      const result = (service as any).calcularFactorSeguridad(320, 0);

      // Assert
      expect(result).toBe(Infinity);
    });
  });
});
