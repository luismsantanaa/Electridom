import { Test, TestingModule } from '@nestjs/testing';
import { CircuitAllocatorService, CargaElectrica, CircuitoAsignado, PanelSchedule } from './circuit-allocator.service';
import { NormParamService } from './norm-param.service';

describe('CircuitAllocatorService', () => {
  let service: CircuitAllocatorService;
  let normParamService: jest.Mocked<NormParamService>;

  const mockNormParamService = {
    getParamAsNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitAllocatorService,
        {
          provide: NormParamService,
          useValue: mockNormParamService,
        },
      ],
    }).compile();

    service = module.get<CircuitAllocatorService>(CircuitAllocatorService);
    normParamService = module.get(NormParamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('asignarCargasACircuitos', () => {
    it('debería asignar cargas a circuitos correctamente', async () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        {
          id: '1',
          environment: 'SALA',
          type: 'ILU',
          watts: 100,
          factorUso: 1,
          vaCalculado: 100,
        },
        {
          id: '2',
          environment: 'COCINA',
          type: 'TOM',
          watts: 1500,
          factorUso: 1,
          vaCalculado: 1500,
        },
      ];

      mockNormParamService.getParamAsNumber
        .mockResolvedValueOnce(1440) // ILU_VA_MAX_POR_CIRCUITO
        .mockResolvedValueOnce(1800) // TOMA_VA_MAX_POR_CIRCUITO
        .mockResolvedValueOnce(2400) // IUG_VA_MAX_POR_CIRCUITO
        .mockResolvedValueOnce(3000) // TUG_VA_MAX_POR_CIRCUITO
        .mockResolvedValueOnce(3600) // IUE_VA_MAX_POR_CIRCUITO
        .mockResolvedValueOnce(4800); // TUE_VA_MAX_POR_CIRCUITO

      // Act
      const result = await service.asignarCargasACircuitos(cargas);

      // Assert
      expect(result).toBeDefined();
      expect(result.circuitos).toHaveLength(2);
      expect(result.totalCargaVA).toBe(1600);
      expect(result.balanceoFases).toBeDefined();

      // Verificar que se llamaron los parámetros normativos
      expect(normParamService.getParamAsNumber).toHaveBeenCalledTimes(6);
    });

    it('debería manejar cargas que exceden el límite por circuito', async () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        {
          id: '1',
          environment: 'SALA',
          type: 'ILU',
          watts: 2000,
          factorUso: 1,
          vaCalculado: 2000,
        },
      ];

      mockNormParamService.getParamAsNumber.mockResolvedValue(1440); // Límite ILU

      // Act
      const result = await service.asignarCargasACircuitos(cargas);

      // Assert
      expect(result.circuitos).toHaveLength(1);
      expect(result.circuitos[0].cargaTotalVA).toBe(2000);
      expect(result.circuitos[0].porcentajeUso).toBeGreaterThan(100);
    });

    it('debería balancear fases correctamente', async () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        { id: '1', environment: 'SALA', type: 'ILU', watts: 1000, vaCalculado: 1000 },
        { id: '2', environment: 'COCINA', type: 'TOM', watts: 1500, vaCalculado: 1500 },
        { id: '3', environment: 'DORMITORIO', type: 'ILU', watts: 800, vaCalculado: 800 },
      ];

      mockNormParamService.getParamAsNumber.mockResolvedValue(1440);

      // Act
      const result = await service.asignarCargasACircuitos(cargas);

      // Assert
      expect(result.balanceoFases).toBeDefined();
      expect(result.circuitos.every(c => c.balanceado)).toBe(true);

      // Verificar que las fases están asignadas
      const fasesAsignadas = result.circuitos.map(c => c.fase);
      expect(fasesAsignadas).toContain('A');
      expect(fasesAsignadas).toContain('B');
      expect(fasesAsignadas).toContain('C');
    });

    it('debería manejar errores correctamente usando valores por defecto', async () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        { id: '1', environment: 'SALA', type: 'ILU', watts: 100, vaCalculado: 100 },
      ];

      mockNormParamService.getParamAsNumber.mockRejectedValue(new Error('Error de base de datos'));

      // Act
      const result = await service.asignarCargasACircuitos(cargas);

      // Assert
      expect(result).toBeDefined();
      expect(result.circuitos).toBeDefined();
      expect(result.circuitos.length).toBeGreaterThan(0);
      // Verificar que se completó la asignación a pesar del error
      expect(result.totalCargaVA).toBe(100);
      expect(result.demandaEstimadaVA).toBe(80); // 80% del total
    });
  });

  describe('agruparCargasPorTipo', () => {
    it('debería agrupar cargas por tipo correctamente', () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        { id: '1', environment: 'SALA', type: 'ILU', watts: 100, vaCalculado: 100 },
        { id: '2', environment: 'COCINA', type: 'TOM', watts: 1500, vaCalculado: 1500 },
        { id: '3', environment: 'DORMITORIO', type: 'ILU', watts: 200, vaCalculado: 200 },
      ];

      // Act
      const result = (service as any).agruparCargasPorTipo(cargas);

      // Assert
      expect(result.get('ILU')).toHaveLength(2);
      expect(result.get('TOM')).toHaveLength(1);
      expect(result.get('IUG')).toBeUndefined();
    });
  });

  describe('crearCircuitosPorTipo', () => {
    it('debería crear circuitos respetando límites', async () => {
      // Arrange
      const cargasPorTipo = new Map<string, CargaElectrica[]>([
        ['ILU', [
          { id: '1', environment: 'SALA', type: 'ILU', watts: 1000, vaCalculado: 1000 },
          { id: '2', environment: 'DORMITORIO', type: 'ILU', watts: 800, vaCalculado: 800 },
        ]],
      ]);

      const limites = {
        iluVAMax: 1440,
        tomaVAMax: 1800,
        iugVAMax: 2400,
        tugVAMax: 3000,
        iueVAMax: 3600,
        tueVAMax: 4800,
      };

      // Act
      const result = await (service as any).crearCircuitosPorTipo(cargasPorTipo, limites, []);

      // Assert
      // Como 1000 + 800 = 1800 > 1440, se deben crear 2 circuitos separados
      expect(result).toHaveLength(2);
      expect(result[0].cargas).toHaveLength(1);
      expect(result[0].cargaTotalVA).toBe(1000);
      expect(result[1].cargas).toHaveLength(1);
      expect(result[1].cargaTotalVA).toBe(800);
    });

    it('debería crear múltiples circuitos cuando se excede el límite', async () => {
      // Arrange
      const cargasPorTipo = new Map<string, CargaElectrica[]>([
        ['ILU', [
          { id: '1', environment: 'SALA', type: 'ILU', watts: 1000, vaCalculado: 1000 },
          { id: '2', environment: 'DORMITORIO', type: 'ILU', watts: 1000, vaCalculado: 1000 },
        ]],
      ]);

      const limites = {
        iluVAMax: 1200, // Límite menor que la suma de cargas
        tomaVAMax: 1800,
        iugVAMax: 2400,
        tugVAMax: 3000,
        iueVAMax: 3600,
        tueVAMax: 4800,
      };

      // Act
      const result = await (service as any).crearCircuitosPorTipo(cargasPorTipo, limites, []);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].cargas).toHaveLength(1);
      expect(result[1].cargas).toHaveLength(1);
    });
  });

  describe('balancearFases', () => {
    it('debería balancear fases correctamente', () => {
      // Arrange
      const circuitos: CircuitoAsignado[] = [
        { id: '1', type: 'ILU', cargas: [], cargaTotalVA: 1000, fase: 'A', porcentajeUso: 0, ambientesIncluidos: [], balanceado: false },
        { id: '2', type: 'TOM', cargas: [], cargaTotalVA: 1500, fase: 'A', porcentajeUso: 0, ambientesIncluidos: [], balanceado: false },
        { id: '3', type: 'ILU', cargas: [], cargaTotalVA: 800, fase: 'A', porcentajeUso: 0, ambientesIncluidos: [], balanceado: false },
      ];

      // Act
      const result = (service as any).balancearFases(circuitos);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every(c => c.balanceado)).toBe(true);

      // Verificar que las fases están distribuidas
      const fases = result.map(c => c.fase);
      expect(fases).toContain('A');
      expect(fases).toContain('B');
      expect(fases).toContain('C');
    });
  });

  describe('calcularPanelSchedule', () => {
    it('debería calcular el panel schedule correctamente', () => {
      // Arrange
      const circuitos: CircuitoAsignado[] = [
        { id: '1', type: 'ILU', cargas: [], cargaTotalVA: 1000, fase: 'A', porcentajeUso: 0, ambientesIncluidos: ['SALA'], balanceado: true },
        { id: '2', type: 'TOM', cargas: [], cargaTotalVA: 1500, fase: 'B', porcentajeUso: 0, ambientesIncluidos: ['COCINA'], balanceado: true },
      ];

      // Act
      const result = (service as any).calcularPanelSchedule(circuitos);

      // Assert
      expect(result.totalCargaVA).toBe(2500);
      expect(result.demandaEstimadaVA).toBe(2000); // 80% del total
      expect(result.balanceoFases.faseA.totalVA).toBe(1000);
      expect(result.balanceoFases.faseB.totalVA).toBe(1500);
      expect(result.balanceoFases.faseC.totalVA).toBe(0);
    });
  });

  describe('obtenerLimitesNormativos', () => {
    it('debería obtener límites normativos correctamente', async () => {
      // Arrange
      mockNormParamService.getParamAsNumber
        .mockResolvedValueOnce(1440)
        .mockResolvedValueOnce(1800)
        .mockResolvedValueOnce(2400)
        .mockResolvedValueOnce(3000)
        .mockResolvedValueOnce(3600)
        .mockResolvedValueOnce(4800);

      // Act
      const result = await (service as any).obtenerLimitesNormativos([]);

      // Assert
      expect(result).toEqual({
        iluVAMax: 1440,
        tomaVAMax: 1800,
        iugVAMax: 2400,
        tugVAMax: 3000,
        iueVAMax: 3600,
        tueVAMax: 4800,
      });
    });
  });

  describe('obtenerLimitePorTipo', () => {
    it('debería mapear límites por tipo correctamente', () => {
      // Arrange
      const limites = {
        iluVAMax: 1440,
        tomaVAMax: 1800,
        iugVAMax: 2400,
        tugVAMax: 3000,
        iueVAMax: 3600,
        tueVAMax: 4800,
      };

      // Act & Assert
      expect((service as any).obtenerLimitePorTipo('ILU', limites)).toBe(1440);
      expect((service as any).obtenerLimitePorTipo('TOM', limites)).toBe(1800);
      expect((service as any).obtenerLimitePorTipo('IUG', limites)).toBe(2400);
      expect((service as any).obtenerLimitePorTipo('TUG', limites)).toBe(3000);
      expect((service as any).obtenerLimitePorTipo('IUE', limites)).toBe(3600);
      expect((service as any).obtenerLimitePorTipo('TUE', limites)).toBe(4800);
      expect((service as any).obtenerLimitePorTipo('UNKNOWN', limites)).toBe(1800); // Default
    });
  });

  describe('crearCircuito', () => {
    it('debería crear un circuito correctamente', () => {
      // Arrange
      const cargas: CargaElectrica[] = [
        { id: '1', environment: 'SALA', type: 'ILU', watts: 100, vaCalculado: 100 },
        { id: '2', environment: 'COCINA', type: 'ILU', watts: 200, vaCalculado: 200 },
      ];

      // Act
      const result = (service as any).crearCircuito(cargas, 'ILU', 1);

      // Assert
      expect(result.id).toBe('CIRC_ILU_1');
      expect(result.type).toBe('ILU');
      expect(result.cargas).toBe(cargas);
      expect(result.cargaTotalVA).toBe(300);
      expect(result.ambientesIncluidos).toEqual(['SALA', 'COCINA']);
      expect(result.balanceado).toBe(false);
    });
  });
});
