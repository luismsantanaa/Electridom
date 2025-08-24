import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TiposArtefactosService } from './tipos-artefactos.service';
import { TipoArtefacto } from './entities/tipo-artefacto.entity';
import { CreateTipoArtefactoDto } from './dtos/create-tipo-artefacto.dto';
import { UpdateTipoArtefactoDto } from './dtos/update-tipo-artefacto.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('TiposArtefactosService', () => {
  let service: TiposArtefactosService;

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
        TiposArtefactosService,
        {
          provide: getRepositoryToken(TipoArtefacto),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TiposArtefactosService>(TiposArtefactosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tipo artefacto', async () => {
      const createDto: CreateTipoArtefactoDto = {
        nombre: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
      };
      const usuario = 'testUser';
      const expectedTipoArtefacto = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: usuario,
      };

      mockRepository.create.mockReturnValue(expectedTipoArtefacto);
      mockRepository.save.mockResolvedValue(expectedTipoArtefacto);

      const result = await service.create(createDto, usuario);

      expect(result).toEqual(expectedTipoArtefacto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usrCreate: usuario,
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
          nombre: 'Test Artefacto',
          potencia: 100,
          voltaje: 220,
          tipoAmbiente_Id: '1',
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['nombre', 'ASC']],
        searchBy: ['nombre'],
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
          nombre: 'Test Artefacto',
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['nombre', 'ASC']],
        searchBy: ['nombre'],
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
    it('should return a tipo artefacto by id', async () => {
      const id = '1';
      const expectedTipoArtefacto = {
        id,
        nombre: 'Test Artefacto',
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
        relations: ['tipoAmbiente'],
      });
    });

    it('should throw NotFoundException when tipo artefacto not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tipo artefacto', async () => {
      const id = '1';
      const updateDto: UpdateTipoArtefactoDto = {
        nombre: 'Updated Artefacto',
      };
      const usuario = 'testUser';
      const existingTipoArtefacto = {
        id,
        nombre: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
      };
      const updatedTipoArtefacto = {
        ...existingTipoArtefacto,
        ...updateDto,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoArtefacto);
      mockRepository.save.mockResolvedValue(updatedTipoArtefacto);

      const result = await service.update(id, updateDto, usuario);

      expect(result).toEqual(updatedTipoArtefacto);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usrUpdate: usuario,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a tipo artefacto', async () => {
      const id = '1';
      const usuario = 'testUser';
      const existingTipoArtefacto = {
        id,
        nombre: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
      };
      const deletedTipoArtefacto = {
        ...existingTipoArtefacto,
        activo: false,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoArtefacto);
      mockRepository.save.mockResolvedValue(deletedTipoArtefacto);

      await service.remove(id, usuario);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
          usrUpdate: usuario,
        }),
      );
    });
  });
});
