import { Test, TestingModule } from '@nestjs/testing';
import { ArtifactTypesController } from './artifact-types.controller';
import { ArtifactTypesService } from './artifact-types.service';
import { CreateArtifactTypeDto } from './dtos/create-artifact-type.dto';
import { UpdateArtifactTypeDto } from './dtos/update-artifact-type.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('ArtifactTypesController', () => {
  let controller: ArtifactTypesController;
  let service: ArtifactTypesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtifactTypesController],
      providers: [
        {
          provide: ArtifactTypesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ArtifactTypesController>(ArtifactTypesController);
    service = module.get<ArtifactTypesService>(ArtifactTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new type artefacto', async () => {
      const createDto: CreateArtifactTypeDto = {
        name: 'Test Artefacto',
        description: 'Test description',
        environmentTypeId: '1',
      };
      const user = createMockUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });
      const expectedTipoArtefacto = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: user,
      };

      mockService.create.mockResolvedValue(expectedTipoArtefacto);

      const mockRequest = { user: { id: user.id } };
      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual(expectedTipoArtefacto);

      expect(service.create).toHaveBeenCalledWith(createDto, user.id);
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

      mockService.findAll.mockResolvedValue(mockPaginateResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginateResult);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a type artefacto by id', async () => {
      const id = '1';
      const expectedTipoArtefacto = {
        id,
        name: 'Test Artefacto',
        description: 'Test description',
        tipoAmbiente_Id: '1',
        activo: true,
      };

      mockService.findOne.mockResolvedValue(expectedTipoArtefacto);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedTipoArtefacto);

      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a type artefacto', async () => {
      const id = '1';
      const updateDto: UpdateArtifactTypeDto = {
        name: 'Updated Artefacto',
      };
      const user = createMockUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });
      const updatedTipoArtefacto = {
        id,
        ...updateDto,
        description: 'Updated description',
        tipoAmbiente_Id: '1',
        activo: true,
        actualizadoPor: user,
      };

      mockService.update.mockResolvedValue(updatedTipoArtefacto);

      const mockRequest = { user: { id: user.id } };
      const result = await controller.update(id, updateDto, mockRequest);

      expect(result).toEqual(updatedTipoArtefacto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto, user.id);
    });
  });

  describe('remove', () => {
    it('should remove a type artefacto', async () => {
      const id = '1';
      const user = createMockUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        apellido: 'User',
        username: 'testUser',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });

      const mockRequest = { user: { id: user.id } };
      await controller.remove(id, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(id, user.id);
    });
  });
});
