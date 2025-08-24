import { Test, TestingModule } from '@nestjs/testing';
import { TiposArtefactosController } from './tipos-artefactos.controller';
import { TiposArtefactosService } from './tipos-artefactos.service';
import { CreateTipoArtefactoDto } from './dtos/create-tipo-artefacto.dto';
import { UpdateTipoArtefactoDto } from './dtos/update-tipo-artefacto.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('TiposArtefactosController', () => {
  let controller: TiposArtefactosController;
  let service: TiposArtefactosService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposArtefactosController],
      providers: [
        {
          provide: TiposArtefactosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TiposArtefactosController>(
      TiposArtefactosController,
    );
    service = module.get<TiposArtefactosService>(TiposArtefactosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tipo artefacto', async () => {
      const createDto: CreateTipoArtefactoDto = {
        nombre: 'Test Artefacto',
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
      };
      const usuario = createMockUser({
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });
      const expectedTipoArtefacto = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: usuario,
      };

      mockService.create.mockResolvedValue(expectedTipoArtefacto);

      const result = await controller.create(createDto, usuario);

      expect(result).toEqual(expectedTipoArtefacto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(createDto, usuario.username);
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

      mockService.findAll.mockResolvedValue(mockPaginateResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginateResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalledWith(query);
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

      mockService.findOne.mockResolvedValue(expectedTipoArtefacto);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedTipoArtefacto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a tipo artefacto', async () => {
      const id = '1';
      const updateDto: UpdateTipoArtefactoDto = {
        nombre: 'Updated Artefacto',
      };
      const usuario = createMockUser({
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });
      const updatedTipoArtefacto = {
        id,
        ...updateDto,
        potencia: 100,
        voltaje: 220,
        tipoAmbiente_Id: '1',
        activo: true,
        actualizadoPor: usuario,
      };

      mockService.update.mockResolvedValue(updatedTipoArtefacto);

      const result = await controller.update(id, updateDto, usuario);

      expect(result).toEqual(updatedTipoArtefacto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith(
        id,
        updateDto,
        usuario.username,
      );
    });
  });

  describe('remove', () => {
    it('should remove a tipo artefacto', async () => {
      const id = '1';
      const usuario = createMockUser({
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });

      await controller.remove(id, usuario);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith(id, usuario.username);
    });
  });
});
