import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TiposInstalacionesService } from './tipos-instalaciones.service';
import { TipoInstalacion } from './entities/tipo-instalacion.entity';
import { CreateTipoInstalacionDto } from './dtos/create-tipo-instalacion.dto';
import { UpdateTipoInstalacionDto } from './dtos/update-tipo-instalacion.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('TiposInstalacionesService', () => {
  let service: TiposInstalacionesService;

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
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiposInstalacionesService,
        {
          provide: getRepositoryToken(TipoInstalacion),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TiposInstalacionesService>(TiposInstalacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tipo instalacion', async () => {
      const createDto: CreateTipoInstalacionDto = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
      };

      const expectedTipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
        usrCreate: 'testUser',
        creationDate: expect.any(Date),
        updateDate: expect.any(Date),
      };

      mockRepository.create.mockReturnValue(expectedTipoInstalacion);
      mockRepository.save.mockResolvedValue(expectedTipoInstalacion);

      const result = await service.create(createDto, 'testUser');

      expect(result).toEqual(expectedTipoInstalacion);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usrCreate: 'testUser',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTipoInstalacion);
    });
  });

  describe('findAll', () => {
    it('should return all active tipos instalacion', async () => {
      const expectedTipoInstalaciones = [
        {
          id: '1',
          nombre: 'Test Instalacion 1',
          descripcion: 'Test Description 1',
          active: true,
        },
        {
          id: '2',
          nombre: 'Test Instalacion 2',
          descripcion: 'Test Description 2',
          active: true,
        },
      ];

      const mockPaginateResult = {
        data: expectedTipoInstalaciones,
        meta: {
          itemsPerPage: 10,
          totalItems: expectedTipoInstalaciones.length,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['nombre', 'ASC']],
          searchBy: ['nombre'],
          search: '',
          select: [],
        },
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      const result = await service.findAll({} as PaginateQuery);

      expect(result.data).toEqual(expectedTipoInstalaciones);
      expect(paginate).toHaveBeenCalled();
    });

    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-instalaciones',
      };
      const mockData = [
        {
          id: '1',
          nombre: 'Test Instalacion',
          descripcion: 'Test Description',
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

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(result.meta).toEqual(mockMeta);
    });

    it('should apply specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-instalaciones',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          nombre: 'Test Instalacion',
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

      await service.findAll(query, specification);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tipo instalacion by id', async () => {
      const id = '1';
      const expectedTipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedTipoInstalacion);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedTipoInstalacion);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
      });
    });

    it('should throw NotFoundException when tipo instalacion not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tipo instalacion', async () => {
      const id = '1';
      const updateDto: UpdateTipoInstalacionDto = {
        nombre: 'Updated Instalacion',
        descripcion: 'Updated Description',
      };

      const existingTipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
      };

      const updatedTipoInstalacion = {
        ...existingTipoInstalacion,
        ...updateDto,
        usrUpdate: 'testUser',
      };

      mockRepository.findOne.mockResolvedValue(existingTipoInstalacion);
      mockRepository.save.mockResolvedValue(updatedTipoInstalacion);

      const result = await service.update(id, updateDto, 'testUser');

      expect(result).toEqual(updatedTipoInstalacion);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedTipoInstalacion);
    });
  });

  describe('remove', () => {
    it('should soft delete a tipo instalacion', async () => {
      const id = '1';
      const usuario = 'testUser';

      const existingTipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
      };

      const deletedTipoInstalacion = {
        ...existingTipoInstalacion,
        active: false,
        usrUpdate: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingTipoInstalacion);
      mockRepository.save.mockResolvedValue(deletedTipoInstalacion);

      await service.remove(id, usuario);

      expect(mockRepository.save).toHaveBeenCalledWith(deletedTipoInstalacion);
    });
  });
});
