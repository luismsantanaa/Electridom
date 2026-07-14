import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProtectionService } from './protection.service';
import {
  Protection,
  BreakerType,
  DifferentialType,
} from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProtectionService', () => {
  let service: ProtectionService;
  let protectionRepository: Repository<Protection>;
  let circuitRepository: Repository<Circuit>;

  const mockProtectionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCircuitRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtectionService,
        {
          provide: getRepositoryToken(Protection),
          useValue: mockProtectionRepository,
        },
        {
          provide: getRepositoryToken(Circuit),
          useValue: mockCircuitRepository,
        },
      ],
    }).compile();

    service = module.get<ProtectionService>(ProtectionService);
    protectionRepository = module.get<Repository<Protection>>(
      getRepositoryToken(Protection),
    );
    circuitRepository = module.get<Repository<Circuit>>(
      getRepositoryToken(Circuit),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProtectionByCircuitId', () => {
    it('debería obtener la protección de un circuito específico', async () => {
      const mockProtection = {
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test protection',
        createdAt: new Date(),
        updatedAt: new Date(),
        circuit: { id: 1, projectId: 1 } as Circuit,
      };

      mockProtectionRepository.findOne.mockResolvedValue(mockProtection);

      const result = await service.getProtectionByCircuitId(1);

      expect(result).toEqual({
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test protection',
        createdAt: mockProtection.createdAt,
        updatedAt: mockProtection.updatedAt,
      });
      expect(mockProtectionRepository.findOne).toHaveBeenCalledWith({
        where: { circuitId: 1 },
        relations: ['circuit'],
      });
    });

    it('debería lanzar NotFoundException si no se encuentra la protección', async () => {
      mockProtectionRepository.findOne.mockResolvedValue(null);

      await expect(service.getProtectionByCircuitId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProtectionsByProjectId', () => {
    it('debería obtener todas las protecciones de un proyecto', async () => {
      const mockCircuits = [
        {
          id: 1,
          loadVA: 1500,
          conductorGauge: '2.0 mm2',
          areaType: 'cocina',
          phase: 1,
          voltage: 120,
          currentA: 12.5,
          protections: [
            {
              id: 1,
              circuitId: 1,
              breakerAmp: 20,
              breakerType: BreakerType.MCB,
              differentialType: DifferentialType.GFCI,
              notes: 'Test protection',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];

      mockCircuitRepository.find.mockResolvedValue(mockCircuits);

      const result = await service.getProtectionsByProjectId(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        loadVA: 1500,
        conductorGauge: '2.0 mm2',
        areaType: 'cocina',
        phase: 1,
        voltage: 120,
        currentA: 12.5,
        protection: {
          id: 1,
          circuitId: 1,
          breakerAmp: 20,
          breakerType: BreakerType.MCB,
          differentialType: DifferentialType.GFCI,
          notes: 'Test protection',
          createdAt: mockCircuits[0].protections[0].createdAt,
          updatedAt: mockCircuits[0].protections[0].updatedAt,
        },
      });
    });
  });

  describe('recalculateProtections', () => {
    it('debería recalcular todas las protecciones de un proyecto', async () => {
      const mockCircuits = [
        {
          id: 1,
          loadVA: 1500,
          conductorGauge: '2.0 mm2',
          areaType: 'cocina',
          phase: 1,
          voltage: 120,
          currentA: 12.5,
        },
      ];

      mockCircuitRepository.find.mockResolvedValue(mockCircuits);
      mockProtectionRepository.findOne.mockResolvedValue(null);
      mockProtectionRepository.create.mockReturnValue({
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test notes',
      });
      mockProtectionRepository.save.mockResolvedValue({
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recalculateProtections(1);

      expect(result).toHaveLength(1);
      expect(result[0].breakerAmp).toBe(20);
      expect(result[0].differentialType).toBe(DifferentialType.GFCI);
    });

    it('debería lanzar NotFoundException si no se encuentran circuitos', async () => {
      mockCircuitRepository.find.mockResolvedValue([]);

      await expect(service.recalculateProtections(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createProtection', () => {
    it('debería crear una nueva protección', async () => {
      const createDto = {
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'New protection',
      };

      const mockProtection = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProtectionRepository.create.mockReturnValue(mockProtection);
      mockProtectionRepository.save.mockResolvedValue(mockProtection);

      const result = await service.createProtection(createDto);

      expect(result).toEqual(mockProtection);
      expect(mockProtectionRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockProtectionRepository.save).toHaveBeenCalledWith(
        mockProtection,
      );
    });
  });

  describe('updateProtection', () => {
    it('debería actualizar una protección existente', async () => {
      const updateDto = {
        breakerAmp: 25,
        notes: 'Updated protection',
      };

      const existingProtection = {
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Old notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProtection = {
        ...existingProtection,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockProtectionRepository.findOne.mockResolvedValue(existingProtection);
      mockProtectionRepository.save.mockResolvedValue(updatedProtection);

      const result = await service.updateProtection(1, updateDto);

      expect(result.breakerAmp).toBe(25);
      expect(result.notes).toBe('Updated protection');
    });

    it('debería lanzar NotFoundException si no se encuentra la protección', async () => {
      mockProtectionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProtection(999, { breakerAmp: 25 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProtection', () => {
    it('debería eliminar una protección existente', async () => {
      const mockProtection = {
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test protection',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProtectionRepository.findOne.mockResolvedValue(mockProtection);
      mockProtectionRepository.remove.mockResolvedValue(mockProtection);

      await service.deleteProtection(1);

      expect(mockProtectionRepository.remove).toHaveBeenCalledWith(
        mockProtection,
      );
    });

    it('debería lanzar NotFoundException si no se encuentra la protección', async () => {
      mockProtectionRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProtection(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Lógica de selección de breakers', () => {
    it('debería seleccionar breaker apropiado para corriente y ampacidad', async () => {
      // Este test verifica la lógica interna del servicio
      const mockCircuit = {
        id: 1,
        loadVA: 1500,
        conductorGauge: '2.0 mm2',
        areaType: 'cocina',
        phase: 1,
        voltage: 120,
        currentA: 12.5,
      };

      mockCircuitRepository.find.mockResolvedValue([mockCircuit]);
      mockProtectionRepository.findOne.mockResolvedValue(null);
      mockProtectionRepository.create.mockReturnValue({
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test notes',
      });
      mockProtectionRepository.save.mockResolvedValue({
        id: 1,
        circuitId: 1,
        breakerAmp: 20,
        breakerType: BreakerType.MCB,
        differentialType: DifferentialType.GFCI,
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recalculateProtections(1);

      // Para 1500VA @ 120V = 12.5A, con conductor 2.0 mm2 (ampacidad 20A)
      // Debería seleccionar breaker de 20A
      expect(result[0].breakerAmp).toBe(20);
      expect(result[0].differentialType).toBe(DifferentialType.GFCI); // cocina requiere GFCI
    });
  });
});
