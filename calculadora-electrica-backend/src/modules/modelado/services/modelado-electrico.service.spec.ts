import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModeladoElectricoService } from './modelado-electrico.service';
import { 
  Proyecto, 
  Ambiente, 
  Carga, 
  Circuito, 
  Proteccion, 
  Conductor,
  NormativaAmpacidad,
  NormativaBreaker
} from '../entities';
import { GenerarCircuitosDto } from '../dto';

describe('ModeladoElectricoService', () => {
  let service: ModeladoElectricoService;
  let proyectoRepository: Repository<Proyecto>;
  let ambienteRepository: Repository<Ambiente>;
  let cargaRepository: Repository<Carga>;
  let circuitoRepository: Repository<Circuito>;
  let proteccionRepository: Repository<Proteccion>;
  let conductorRepository: Repository<Conductor>;
  let normativaAmpacidadRepository: Repository<NormativaAmpacidad>;
  let normativaBreakerRepository: Repository<NormativaBreaker>;

  const mockProyectoRepository = {
    findOne: jest.fn(),
  };

  const mockCircuitoRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockProteccionRepository = {
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockConductorRepository = {
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockNormativaAmpacidadRepository = {
    findOne: jest.fn(),
  };

  const mockNormativaBreakerRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModeladoElectricoService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: mockProyectoRepository,
        },
        {
          provide: getRepositoryToken(Ambiente),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Carga),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Circuito),
          useValue: mockCircuitoRepository,
        },
        {
          provide: getRepositoryToken(Proteccion),
          useValue: mockProteccionRepository,
        },
        {
          provide: getRepositoryToken(Conductor),
          useValue: mockConductorRepository,
        },
        {
          provide: getRepositoryToken(NormativaAmpacidad),
          useValue: mockNormativaAmpacidadRepository,
        },
        {
          provide: getRepositoryToken(NormativaBreaker),
          useValue: mockNormativaBreakerRepository,
        },
      ],
    }).compile();

    service = module.get<ModeladoElectricoService>(ModeladoElectricoService);
    proyectoRepository = module.get<Repository<Proyecto>>(getRepositoryToken(Proyecto));
    circuitoRepository = module.get<Repository<Circuito>>(getRepositoryToken(Circuito));
    proteccionRepository = module.get<Repository<Proteccion>>(getRepositoryToken(Proteccion));
    conductorRepository = module.get<Repository<Conductor>>(getRepositoryToken(Conductor));
    normativaAmpacidadRepository = module.get<Repository<NormativaAmpacidad>>(getRepositoryToken(NormativaAmpacidad));
    normativaBreakerRepository = module.get<Repository<NormativaBreaker>>(getRepositoryToken(NormativaBreaker));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generarCircuitos', () => {
    const mockProyecto = {
      id: 1,
      nombre: 'Proyecto Test',
      tension_sistema: '120V',
      fases: 1,
      factor_potencia: 0.9,
      ambientes: [
        {
          id: 1,
          nombre: 'Sala',
          cargas: [
            {
              id: 1,
              nombre: 'Lámpara LED',
              potencia_w: 15,
              tipo: 'IUG',
            },
            {
              id: 2,
              nombre: 'TV',
              potencia_w: 100,
              tipo: 'TUG',
            },
          ],
        },
      ],
    };

    const mockDto: GenerarCircuitosDto = {
      proyecto_id: 1,
      tension_sistema: '120V',
      fases: 1,
      factor_potencia: 0.9,
      material_conductor: 'Cu',
      tipo_aislamiento: 'THHN',
      temperatura_ambiente: 30,
    };

    it('should generate circuits successfully', async () => {
      // Mock proyecto exists
      mockProyectoRepository.findOne.mockResolvedValue(mockProyecto);

      // Mock existing circuits cleanup
      mockCircuitoRepository.find.mockResolvedValue([]);

      // Mock circuit creation
      const mockCircuito = {
        id: 1,
        proyecto_id: 1,
        ambiente_id: 1,
        tipo: 'IUG',
        potencia_va: 17,
        corriente_a: 0.14,
        nombre: 'IUG - Sala',
        numero_circuito: 1,
        observaciones: 'Circuito IUG para Sala',
        factor_potencia: 0.9,
      };
      mockCircuitoRepository.save.mockResolvedValue(mockCircuito);

      // Mock protection assignment
      const mockProteccion = {
        circuito_id: 1,
        tipo: 'MCB',
        capacidad_a: 15,
        curva: 'C',
        descripcion: 'MCB 15A curva C',
      };
      mockProteccionRepository.save.mockResolvedValue(mockProteccion);

      // Mock conductor assignment
      const mockConductor = {
        circuito_id: 1,
        calibre_awg: '14',
        material: 'Cu',
        capacidad_a: 15,
        tipo_aislamiento: 'THHN',
        descripcion: '14 AWG Cu THHN',
      };
      mockConductorRepository.save.mockResolvedValue(mockConductor);

      // Mock normativa lookups
      mockNormativaBreakerRepository.findOne.mockResolvedValue({
        capacidad_a: 15,
        curva: 'C',
      });

      mockNormativaAmpacidadRepository.findOne.mockResolvedValue({
        calibre_awg: '14',
        material: 'Cu',
        capacidad_a: 15,
      });

      // Mock circuit with relations
      mockCircuitoRepository.findOne.mockResolvedValue({
        ...mockCircuito,
        protecciones: [mockProteccion],
        conductores: [mockConductor],
      });

      const result = await service.generarCircuitos(mockDto);

      expect(result).toBeDefined();
      expect(result.proyecto_id).toBe(1);
      expect(result.proyecto_nombre).toBe('Proyecto Test');
      expect(result.circuitos).toHaveLength(2); // IUG and TUG circuits
      expect(result.total_circuitos).toBe(2);
      expect(result.potencia_total_va).toBeGreaterThan(0);
      expect(result.corriente_total_a).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProyectoRepository.findOne.mockResolvedValue(null);

      await expect(service.generarCircuitos(mockDto)).rejects.toThrow(
        'Proyecto con ID 1 no encontrado'
      );
    });

    it('should handle empty project environments', async () => {
      const emptyProyecto = {
        ...mockProyecto,
        ambientes: [],
      };

      mockProyectoRepository.findOne.mockResolvedValue(emptyProyecto);
      mockCircuitoRepository.find.mockResolvedValue([]);

      const result = await service.generarCircuitos(mockDto);

      expect(result).toBeDefined();
      expect(result.circuitos).toHaveLength(0);
      expect(result.total_circuitos).toBe(0);
      expect(result.potencia_total_va).toBe(0);
      expect(result.corriente_total_a).toBe(0);
    });
  });

  describe('obtenerResultados', () => {
    const mockProyectoConCircuitos = {
      id: 1,
      nombre: 'Proyecto Test',
      tension_sistema: '120V',
      fases: 1,
      factor_potencia: 0.9,
      circuitos: [
        {
          id: 1,
          ambiente_id: 1,
          tipo: 'IUG',
          potencia_va: 17,
          corriente_a: 0.14,
          nombre: 'IUG - Sala',
          numero_circuito: 1,
          observaciones: 'Circuito IUG para Sala',
          protecciones: [
            {
              id: 1,
              tipo: 'MCB',
              capacidad_a: 15,
              curva: 'C',
              marca: 'Schneider',
              modelo: 'EasyPact',
            },
          ],
          conductores: [
            {
              id: 1,
              calibre_awg: '14',
              material: 'Cu',
              capacidad_a: 15,
              tipo_aislamiento: 'THHN',
              longitud_m: 10,
              caida_tension: 0.5,
            },
          ],
        },
      ],
    };

    it('should return project results successfully', async () => {
      mockProyectoRepository.findOne.mockResolvedValue(mockProyectoConCircuitos);

      const result = await service.obtenerResultados(1);

      expect(result).toBeDefined();
      expect(result.proyecto_id).toBe(1);
      expect(result.proyecto_nombre).toBe('Proyecto Test');
      expect(result.circuitos).toHaveLength(1);
      expect(result.circuitos[0].proteccion).toBeDefined();
      expect(result.circuitos[0].conductor).toBeDefined();
      expect(result.total_circuitos).toBe(1);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProyectoRepository.findOne.mockResolvedValue(null);

      await expect(service.obtenerResultados(999)).rejects.toThrow(
        'Proyecto con ID 999 no encontrado'
      );
    });

    it('should throw NotFoundException when project has no circuits', async () => {
      const proyectoSinCircuitos = {
        ...mockProyectoConCircuitos,
        circuitos: [],
      };

      mockProyectoRepository.findOne.mockResolvedValue(proyectoSinCircuitos);

      await expect(service.obtenerResultados(1)).rejects.toThrow(
        'No hay circuitos generados para el proyecto 1'
      );
    });
  });

  describe('private methods', () => {
    it('should extract tension correctly', () => {
      const serviceAny = service as any;
      
      expect(serviceAny.extraerTension('120V')).toBe(120);
      expect(serviceAny.extraerTension('208V')).toBe(208);
      expect(serviceAny.extraerTension('480V')).toBe(480);
      expect(serviceAny.extraerTension('invalid')).toBe(120); // default
    });

    it('should calculate default calibre correctly', () => {
      const serviceAny = service as any;
      
      expect(serviceAny.calcularCalibreDefault(10)).toBe('14');
      expect(serviceAny.calcularCalibreDefault(20)).toBe('12');
      expect(serviceAny.calcularCalibreDefault(35)).toBe('10');
      expect(serviceAny.calcularCalibreDefault(50)).toBe('8');
      expect(serviceAny.calcularCalibreDefault(200)).toBe('1/0');
    });

    it('should group loads by type correctly', () => {
      const serviceAny = service as any;
      const cargas = [
        { tipo: 'IUG', nombre: 'Carga 1' },
        { tipo: 'TUG', nombre: 'Carga 2' },
        { tipo: 'IUG', nombre: 'Carga 3' },
        { tipo: 'IUE', nombre: 'Carga 4' },
      ];

      const grupos = serviceAny.agruparCargasPorTipo(cargas);

      expect(grupos.IUG).toHaveLength(2);
      expect(grupos.TUG).toHaveLength(1);
      expect(grupos.IUE).toHaveLength(1);
      expect(grupos.TUE).toBeUndefined();
    });
  });
});
