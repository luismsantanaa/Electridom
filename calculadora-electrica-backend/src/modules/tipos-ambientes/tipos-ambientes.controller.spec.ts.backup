import { Test, TestingModule } from '@nestjs/testing';
import { TiposAmbientesController } from './tipos-ambientes.controller';
import { TiposAmbientesService } from './tipos-ambientes.service';
import { CreateTipoAmbienteDto } from './dtos/create-tipo-ambiente.dto';
import { UpdateTipoAmbienteDto } from './dtos/update-tipo-ambiente.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { TipoAmbiente } from './entities/tipo-ambiente.entity';
import { TipoInstalacion } from '../tipos-instalaciones/entities/tipo-instalacion.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('TiposAmbientesController', () => {
  let controller: TiposAmbientesController;
  let mockService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let mockUser: User;

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockUser = createMockUser({
      role: UserRole.ADMIN,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposAmbientesController],
      providers: [
        {
          provide: TiposAmbientesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TiposAmbientesController>(TiposAmbientesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tipo ambiente', async () => {
      const createDto: CreateTipoAmbienteDto = {
        nombre: 'Test Ambiente',
        tipoInstalacion_Id: '1',
      };

      const mockTipoInstalacion: TipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: 'system',
        usrUpdate: 'system',
      };

      const expectedTipoAmbiente: TipoAmbiente = {
        id: '1',
        nombre: createDto.nombre,
        descripcion: '',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: mockUser.username,
        usrUpdate: mockUser.username,
      };

      mockService.create.mockResolvedValue(expectedTipoAmbiente);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockService.create).toHaveBeenCalledWith(
        createDto,
        mockUser.username,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-ambientes',
      };
      const mockPaginatedResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            nombre: 'Test Ambiente',
            tipoInstalacion_Id: '1',
            active: true,
          },
        ],
        total: 1,
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['nombre', 'ASC']],
          searchBy: ['nombre'],
          search: '',
          select: [],
        },
      };

      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockService.findAll).toHaveBeenCalledWith(
        query,
        expect.any(Object),
      );
    });

    it('should apply nombre specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-ambientes',
      };
      const nombre = 'Test';
      const mockPaginatedResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            nombre: 'Test Ambiente',
            tipoInstalacion_Id: '1',
            active: true,
          },
        ],
        total: 1,
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['nombre', 'ASC']],
          searchBy: ['nombre'],
          search: '',
          select: [],
        },
      };

      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(query, nombre);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockService.findAll).toHaveBeenCalledWith(
        query,
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('should return a tipo ambiente by id', async () => {
      const id = '1';
      const expectedTipoAmbiente = {
        id,
        nombre: 'Test Ambiente',
        tipoInstalacion_Id: '1',
        active: true,
      };

      mockService.findOne.mockResolvedValue(expectedTipoAmbiente);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a tipo ambiente', async () => {
      const id = '1';
      const updateDto: UpdateTipoAmbienteDto = {
        nombre: 'Updated Ambiente',
      };

      const mockTipoInstalacion: TipoInstalacion = {
        id: '1',
        nombre: 'Test Instalacion',
        descripcion: 'Test Description',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: 'system',
        usrUpdate: 'system',
      };

      const expectedTipoAmbiente: TipoAmbiente = {
        id,
        nombre: updateDto.nombre || 'Default Name',
        descripcion: '',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: mockUser.username,
        usrUpdate: mockUser.username,
      };

      mockService.update.mockResolvedValue(expectedTipoAmbiente);

      const result = await controller.update(id, updateDto, mockUser);

      expect(result).toEqual(expectedTipoAmbiente);
      expect(mockService.update).toHaveBeenCalledWith(
        id,
        updateDto,
        mockUser.username,
      );
    });
  });

  describe('remove', () => {
    it('should remove a tipo ambiente', async () => {
      const id = '1';
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);

      expect(mockService.remove).toHaveBeenCalledWith(id, mockUser.username);
    });
  });
});
