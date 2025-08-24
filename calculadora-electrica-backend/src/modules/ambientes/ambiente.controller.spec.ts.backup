import { Test, TestingModule } from '@nestjs/testing';
import { AmbienteController } from './ambiente.controller';
import { AmbienteService } from './ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { PaginateQuery } from 'nestjs-paginate';
import { tipoSuperficieEnum } from '../../common/dtos/enums';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { createMockUser } from '../users/__tests__/user.mock.helper';

describe('AmbienteController', () => {
  let controller: AmbienteController;

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
      controllers: [AmbienteController],
      providers: [
        {
          provide: AmbienteService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AmbienteController>(AmbienteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ambiente', async () => {
      const createDto: CreateAmbienteDto = {
        nombre: 'Test Ambiente',
        tipoAmbienteId: '1',
        tipoSuperficie: tipoSuperficieEnum.RECTANGULAR,
        proyectoId: '1',
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
        path: '/ambientes',
      };
      const mockResult = {
        success: true,
        message: 'Operación exitosa',
        data: [
          {
            id: '1',
            nombre: 'Test Ambiente',
            activo: true,
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
    it('should return an ambiente by id', async () => {
      const id = '1';
      const expectedResult = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };

      mockService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update an ambiente', async () => {
      const id = '1';
      const updateDto: UpdateAmbienteDto = {
        nombre: 'Updated Ambiente',
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
    it('should remove an ambiente', async () => {
      const id = '1';

      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);

      expect(mockService.remove).toHaveBeenCalledWith(id, mockUser.username);
    });
  });
});
