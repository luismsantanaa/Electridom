import { Test, TestingModule } from '@nestjs/testing';
import { TiposInstalacionesController } from './tipos-installations.controller';
import { TiposInstalacionesService } from './tipos-installations.service';
import { CreateTipoInstalacionDto } from './dtos/create-type-installation.dto';
import { UpdateTipoInstalacionDto } from './dtos/update-type-installation.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';
import { PaginateQuery } from 'nestjs-paginate';

describe('TiposInstalacionesController', () => {
  let controller: TiposInstalacionesController;
  let service: TiposInstalacionesService;

  const mockTiposInstalacionesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposInstalacionesController],
      providers: [
        {
          provide: TiposInstalacionesService,
          useValue: mockTiposInstalacionesService,
        },
      ],
    }).compile();

    controller = module.get<TiposInstalacionesController>(
      TiposInstalacionesController,
    );
    service = module.get<TiposInstalacionesService>(TiposInstalacionesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new type installation', async () => {
      const createDto: CreateTipoInstalacionDto = {
        id: '1',
        name: 'Test installation',
        description: 'Test Description',
      };

      const mockUser = createMockUser({ role: UserRole.ADMIN });

      const expectedResult = {
        id: '1',
        name: 'Test installation',
        description: 'Test Description',
        active: true,
        usrCreate: 'testuser',
        creationDate: expect.any(Date),
        updateDate: expect.any(Date),
      };

      mockTiposInstalacionesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockUser.username);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.username);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all tipos installation', async () => {
      const expectedResult = [
        {
          id: '1',
          name: 'Test installation 1',
          description: 'Test Description 1',
          active: true,
        },
        {
          id: '2',
          name: 'Test installation 2',
          description: 'Test Description 2',
          active: true,
        },
      ];

      mockTiposInstalacionesService.findAll.mockResolvedValue(expectedResult);

      const mockQuery: PaginateQuery = { page: 1, limit: 10, path: '/tipos-installations' };
      const result = await controller.findAll(mockQuery);

      expect(service.findAll).toHaveBeenCalledWith(
        mockQuery,
        expect.any(Object),
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a type installation by id', async () => {
      const id = '1';
      const expectedResult = {
        id: '1',
        name: 'Test installation',
        description: 'Test Description',
        active: true,
      };

      mockTiposInstalacionesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a type installation', async () => {
      const id = '1';
      const updateDto: UpdateTipoInstalacionDto = {
        name: 'Updated installation',
        description: 'Updated Description',
      };

      const mockUser = createMockUser({ role: UserRole.ADMIN });

      const expectedResult = {
        id: '1',
        name: 'Updated installation',
        description: 'Updated Description',
        active: true,
        usrUpdate: 'testuser',
      };

      mockTiposInstalacionesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto, mockUser.username);

      expect(service.update).toHaveBeenCalledWith(
        id,
        updateDto,
        mockUser.username,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a type installation', async () => {
      const id = '1';
      const mockUser = createMockUser({ role: UserRole.ADMIN });

      mockTiposInstalacionesService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser.username);

      expect(service.remove).toHaveBeenCalledWith(id, mockUser.username);
    });
  });
});

