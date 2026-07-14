import { Test, TestingModule } from '@nestjs/testing';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('LoadsController', () => {
  let controller: LoadsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser({
    role: UserRole.ADMIN,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoadsController],
      providers: [
        {
          provide: LoadsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LoadsController>(LoadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      const expectedResult = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: mockUser.username,
      };

      mockService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(expectedResult);
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
        path: '/loads',
      };
      const mockResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            tipoAmbiente: { id: '1', name: 'Test environment' },
            tipoArtefacto: { id: '1', name: 'Test Artefacto' },
            activo: true,
          },
        ],
        total: 1,
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['tipoAmbiente', 'ASC']],
          searchBy: ['tipoAmbiente', 'tipoArtefacto'],
          search: '',
          select: [],
        },
      };

      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(mockService.findAll).toHaveBeenCalledWith(
        query,
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('should return a load by id', async () => {
      const id = '1';
      const expectedResult = {
        id,
        tipoAmbiente: { id: '1', name: 'Test environment' },
        tipoArtefacto: { id: '1', name: 'Test Artefacto' },
        activo: true,
      };

      mockService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a load', async () => {
      const id = '1';
      const updateDto: UpdateLoadDto = {
        voltage: 110,
      };
      const expectedResult = {
        id,
        ...updateDto,
        activo: true,
        actualizadoPor: mockUser.username,
      };

      mockService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockService.update).toHaveBeenCalledWith(
        id,
        updateDto,
        mockUser.username,
      );
    });
  });

  describe('remove', () => {
    it('should remove a load', async () => {
      const id = '1';

      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);

      expect(mockService.remove).toHaveBeenCalledWith(id, mockUser.username);
    });
  });
});
