import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnvironmentTypesService } from './environment-types.service';
import { EnvironmentType } from './entities/environment-type.entity';
import { CreateEnvironmentTypeDto } from './dtos/create-environment-type.dto';
import { UpdateEnvironmentTypeDto } from './dtos/update-environment-type.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('EnvironmentTypesService', () => {
  let service: EnvironmentTypesService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentTypesService,
        {
          provide: getRepositoryToken(EnvironmentType),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EnvironmentTypesService>(EnvironmentTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new type environment', async () => {
      const createDto: CreateEnvironmentTypeDto = {
        name: 'Test environment',
        installationTypeId: '1',
      };
      const user = 'testUser';
      const expectedTipoAmbiente = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: user,
      };

      mockRepository.create.mockReturnValue(expectedTipoAmbiente);
      mockRepository.save.mockResolvedValue(expectedTipoAmbiente);

      const result = await service.create(createDto, user);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usrCreate: user,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTipoAmbiente);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-environments',
      };
      const mockData = [
        {
          id: '1',
          name: 'Test environment',
          activo: true,
          tipoInstalacion: { id: '1', name: 'Test installation' },
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['name', 'ASC']],
        searchBy: ['name'],
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
        path: '/tipos-environments',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          name: 'Test environment',
          activo: true,
          tipoInstalacion: { id: '1', name: 'Test installation' },
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['name', 'ASC']],
        searchBy: ['name'],
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
    it('should return a type environment by id', async () => {
      const id = '1';
      const expectedTipoAmbiente = {
        id,
        name: 'Test environment',
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedTipoAmbiente);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
      });
    });

    it('should throw NotFoundException when type environment not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a type environment', async () => {
      const id = '1';
      const updateDto: UpdateEnvironmentTypeDto = {
        name: 'Updated environment',
      };
      const user = 'testUser';
      const existingTipoAmbiente = {
        id,
        name: 'Test environment',
        activo: true,
      };
      const updatedTipoAmbiente = {
        ...existingTipoAmbiente,
        ...updateDto,
        usrUpdate: user,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoAmbiente);
      mockRepository.save.mockResolvedValue(updatedTipoAmbiente);

      const result = await service.update(id, updateDto, user);

      expect(result).toEqual(updatedTipoAmbiente);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedTipoAmbiente);
    });
  });

  describe('remove', () => {
    it('should soft delete a type environment', async () => {
      const id = '1';
      const user = 'testUser';
      const existingTipoAmbiente = {
        id,
        name: 'Test environment',
        activo: true,
      };
      const deletedTipoAmbiente = {
        ...existingTipoAmbiente,
        activo: false,
        actualizadoPor: user,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoAmbiente);
      mockRepository.save.mockResolvedValue(deletedTipoAmbiente);

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

