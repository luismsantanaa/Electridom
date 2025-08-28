import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ArtifactTypesService } from './artifact-types.service';
import { ArtifactType } from './entities/artifact-type.entity';
import { CreateArtifactTypeDto } from './dtos/create-artifact-type.dto';
import { UpdateArtifactTypeDto } from './dtos/update-artifact-type.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('ArtifactTypesService', () => {
  let service: ArtifactTypesService;

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
        ArtifactTypesService,
        {
          provide: getRepositoryToken(ArtifactType),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ArtifactTypesService>(ArtifactTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new type artefacto', async () => {
      const createDto: CreateArtifactTypeDto = {
        name: 'Test Artefacto',
        description: 'Test description',
        environmentTypeId: '1',
      };
      const user = 'testUser';
      const expectedTipoArtefacto = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: user,
      };

      mockRepository.create.mockReturnValue(expectedTipoArtefacto);
      mockRepository.save.mockResolvedValue(expectedTipoArtefacto);

      const result = await service.create(createDto, user);

      expect(result).toEqual(expectedTipoArtefacto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usrCreate: user,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTipoArtefacto);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-artefactos',
      };
      const mockData = [
        {
          id: '1',
          name: 'Test Artefacto',
          description: 'Test description',
          tipoAmbiente_Id: '1',
          activo: true,
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

      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual(mockMeta);
    });

    it('should apply specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-artefactos',
      };

      const mockData = [
        {
          id: '1',
          name: 'Test Artefacto',
          activo: true,
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

      await service.findAll(query);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a type artefacto by id', async () => {
      const id = '1';
      const expectedTipoArtefacto = {
        id,
        name: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedTipoArtefacto);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedTipoArtefacto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
        relations: ['environmentType'],
      });
    });

    it('should throw NotFoundException when type artefacto not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a type artefacto', async () => {
      const id = '1';
      const updateDto: UpdateArtifactTypeDto = {
        name: 'Updated Artefacto',
      };
      const user = 'testUser';
      const existingTipoArtefacto = {
        id,
        name: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
      };
      const updatedTipoArtefacto = {
        ...existingTipoArtefacto,
        ...updateDto,
        actualizadoPor: user,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoArtefacto);
      mockRepository.save.mockResolvedValue(updatedTipoArtefacto);

      const result = await service.update(id, updateDto, user);

      expect(result).toEqual(updatedTipoArtefacto);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usrUpdate: user,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a type artefacto', async () => {
      const id = '1';
      const user = 'testUser';
      const existingTipoArtefacto = {
        id,
        name: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
      };
      const deletedTipoArtefacto = {
        ...existingTipoArtefacto,
        activo: false,
        actualizadoPor: user,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoArtefacto);
      mockRepository.save.mockResolvedValue(deletedTipoArtefacto);

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

