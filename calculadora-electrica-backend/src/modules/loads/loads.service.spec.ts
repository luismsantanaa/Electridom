import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoadsService } from './loads.service';
import { Load } from './entities/load.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('LoadsService', () => {
  let service: LoadsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadsService,
        {
          provide: getRepositoryToken(Load),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LoadsService>(LoadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new load', async () => {
      const createDto: CreateLoadDto = {
        environmentType: '1',
        artifactType: '1',
        voltage: 220,
        usageHours: 8,
        projectId: '1',
      };
      const user = 'testUser';
      const expectedCarga = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: user,
      };

      mockRepository.create.mockReturnValue(expectedCarga);
      mockRepository.save.mockResolvedValue(expectedCarga);

      const result = await service.create(createDto, user);

      expect(result).toEqual(expectedCarga);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: `load ${createDto.artifactType}`,
        power: 0,
        voltage: createDto.voltage,
        artifactType: { id: createDto.artifactType },
        usrCreate: user,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedCarga);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/loads',
      };
      const mockData = [
        {
          id: '1',
          tipoAmbiente: { id: '1', name: 'Test environment' },
          tipoArtefacto: { id: '1', name: 'Test Artefacto' },
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['tipoAmbiente', 'ASC']],
        searchBy: ['tipoAmbiente', 'tipoArtefacto'],
        search: '',
        select: [],
      };

      const mockPaginateResult = {
        data: mockData,
        meta: mockMeta,
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      const result = await service.findAll(query);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(result.meta).toEqual(mockMeta);
    });

    it('should apply specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/loads',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          tipoAmbiente: { id: '1', name: 'Test environment' },
          tipoArtefacto: { id: '1', name: 'Test Artefacto' },
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['tipoAmbiente', 'ASC']],
        searchBy: ['tipoAmbiente', 'tipoArtefacto'],
        search: '',
        select: [],
      };

      const mockPaginateResult = {
        data: mockData,
        meta: mockMeta,
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      await service.findAll(query, specification);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a load by id', async () => {
      const id = '1';
      const expectedCarga = {
        id,
        tipoAmbiente: { id: '1', name: 'Test environment' },
        tipoArtefacto: { id: '1', name: 'Test Artefacto' },
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedCarga);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedCarga);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
        relations: ['artifactType'],
      });
    });

    it('should throw NotFoundException when load not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a load', async () => {
      const id = '1';
      const updateDto: UpdateLoadDto = {
        voltage: 110,
      };
      const user = 'testUser';
      const existingCarga = {
        id,
        tipoAmbiente: { id: '1', name: 'Test environment' },
        tipoArtefacto: { id: '1', name: 'Test Artefacto' },
        activo: true,
      };
      const updatedCarga = {
        ...existingCarga,
        ...updateDto,
        actualizadoPor: user,
      };

      mockRepository.findOne.mockResolvedValue(existingCarga);
      mockRepository.save.mockResolvedValue(updatedCarga);

      const result = await service.update(id, updateDto, user);

      expect(result).toEqual(updatedCarga);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usrUpdate: user,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a load', async () => {
      const id = '1';
      const user = 'testUser';
      const existingCarga = {
        id,
        tipoAmbiente: { id: '1', name: 'Test environment' },
        tipoArtefacto: { id: '1', name: 'Test Artefacto' },
        activo: true,
      };
      const deletedCarga = {
        ...existingCarga,
        activo: false,
        actualizadoPor: user,
      };

      mockRepository.findOne.mockResolvedValue(existingCarga);
      mockRepository.save.mockResolvedValue(deletedCarga);

      await service.remove(id, user);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
          usrUpdate: user,
        }),
      );
    });
  });
});
