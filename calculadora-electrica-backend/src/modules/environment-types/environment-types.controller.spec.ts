import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentTypesController } from './environment-types.controller';
import { EnvironmentTypesService } from './environment-types.service';
import { CreateEnvironmentTypeDto } from './dtos/create-environment-type.dto';
import { UpdateEnvironmentTypeDto } from './dtos/update-environment-type.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { EnvironmentType } from './entities/environment-type.entity';
import { InstallationType } from '../installation-types/entities/installation-type.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('EnvironmentTypesController', () => {
  let controller: EnvironmentTypesController;
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
      controllers: [EnvironmentTypesController],
      providers: [
        {
          provide: EnvironmentTypesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EnvironmentTypesController>(
      EnvironmentTypesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new type environment', async () => {
      const createDto: CreateEnvironmentTypeDto = {
        name: 'Test environment',
        installationTypeId: '1',
      };

      const mockInstallationType: InstallationType = {
        id: '1',
        name: 'Test installation',
        description: 'Test Description',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: 'system',
        usrUpdate: 'system',
        environmentTypes: [],
      };

      const expectedEnvironmentType: EnvironmentType = {
        id: '1',
        name: createDto.name,
        description: '',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: mockUser.username,
        usrUpdate: mockUser.username,
        installationType: mockInstallationType,
        installationTypeId: '1',
        artifactTypes: [],
      };

      mockService.create.mockResolvedValue(expectedEnvironmentType);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(expectedEnvironmentType);
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
        path: '/tipos-environments',
      };
      const mockPaginatedResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            name: 'Test environment',
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
          sortBy: [['name', 'ASC']],
          searchBy: ['name'],
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

    it('should apply name specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/tipos-environments',
      };
      const name = 'Test';
      const mockPaginatedResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            name: 'Test environment',
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
          sortBy: [['name', 'ASC']],
          searchBy: ['name'],
          search: '',
          select: [],
        },
      };

      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(query, name);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockService.findAll).toHaveBeenCalledWith(
        query,
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('should return a type environment by id', async () => {
      const id = '1';
      const expectedTipoAmbiente = {
        id,
        name: 'Test environment',
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
    it('should update a type environment', async () => {
      const id = '1';
      const updateDto: UpdateEnvironmentTypeDto = {
        name: 'Updated environment',
      };

      const mockInstallationType: InstallationType = {
        id: '1',
        name: 'Test installation',
        description: 'Test Description',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: 'system',
        usrUpdate: 'system',
        environmentTypes: [],
      };

      const expectedEnvironmentType: EnvironmentType = {
        id,
        name: updateDto.name || 'Default Name',
        description: '',
        active: true,
        creationDate: new Date(),
        updateDate: new Date(),
        usrCreate: mockUser.username,
        usrUpdate: mockUser.username,
        installationType: mockInstallationType,
        installationTypeId: '1',
        artifactTypes: [],
      };

      mockService.update.mockResolvedValue(expectedEnvironmentType);

      const result = await controller.update(id, updateDto, mockUser);

      expect(result).toEqual(expectedEnvironmentType);
      expect(mockService.update).toHaveBeenCalledWith(
        id,
        updateDto,
        mockUser.username,
      );
    });
  });

  describe('remove', () => {
    it('should remove a type environment', async () => {
      const id = '1';
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);

      expect(mockService.remove).toHaveBeenCalledWith(id, mockUser.username);
    });
  });
});
