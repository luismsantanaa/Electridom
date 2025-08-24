import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TiposAmbientesService } from './tipos-ambientes.service';
import { TipoAmbiente } from './entities/tipo-ambiente.entity';
import { CreateTipoAmbienteDto } from './dtos/create-tipo-ambiente.dto';
import { UpdateTipoAmbienteDto } from './dtos/update-tipo-ambiente.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('TiposAmbientesService', () => {
  let service: TiposAmbientesService;

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
        TiposAmbientesService,
        {
          provide: getRepositoryToken(TipoAmbiente),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TiposAmbientesService>(TiposAmbientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tipo ambiente', async () => {
      const createDto: CreateTipoAmbienteDto = {
        nombre: 'Test Ambiente',
        tipoInstalacion_Id: '1',
      };
      const usuario = 'testUser';
      const expectedTipoAmbiente = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: usuario,
      };

      mockRepository.create.mockReturnValue(expectedTipoAmbiente);
      mockRepository.save.mockResolvedValue(expectedTipoAmbiente);

      const result = await service.create(createDto, usuario);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usrCreate: usuario,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTipoAmbiente);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-ambientes',
      };
      const mockData = [
        {
          id: '1',
          nombre: 'Test Ambiente',
          activo: true,
          tipoInstalacion: { id: '1', nombre: 'Test Instalacion' },
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

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(result.meta).toEqual(mockMeta);
    });

    it('should apply specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-ambientes',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          nombre: 'Test Ambiente',
          activo: true,
          tipoInstalacion: { id: '1', nombre: 'Test Instalacion' },
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

      await service.findAll(query, specification);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tipo ambiente by id', async () => {
      const id = '1';
      const expectedTipoAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedTipoAmbiente);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
      });
    });

    it('should throw NotFoundException when tipo ambiente not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tipo ambiente', async () => {
      const id = '1';
      const updateDto: UpdateTipoAmbienteDto = {
        nombre: 'Updated Ambiente',
      };
      const usuario = 'testUser';
      const existingTipoAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };
      const updatedTipoAmbiente = {
        ...existingTipoAmbiente,
        ...updateDto,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoAmbiente);
      mockRepository.save.mockResolvedValue(updatedTipoAmbiente);

      const result = await service.update(id, updateDto, usuario);

      expect(result).toEqual(updatedTipoAmbiente);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedTipoAmbiente);
    });
  });

  describe('remove', () => {
    it('should soft delete a tipo ambiente', async () => {
      const id = '1';
      const usuario = 'testUser';
      const existingTipoAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };
      const deletedTipoAmbiente = {
        ...existingTipoAmbiente,
        activo: false,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoAmbiente);
      mockRepository.save.mockResolvedValue(deletedTipoAmbiente);

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
