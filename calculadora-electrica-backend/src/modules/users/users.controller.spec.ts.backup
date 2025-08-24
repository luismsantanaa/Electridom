import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const userMock: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    nombre: 'Test',
    apellido: 'User',
    role: UserRole.CLIENTE,
    estado: UserStatus.ACTIVO,
    telefono: '123456789',
    empresa: 'TestCorp',
    cedula: '1234567890',
    ultimoAcceso: new Date(),
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
    toJSON: jest.fn(),
  } as unknown as User;

  const serviceMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todos los usuarios', async () => {
      serviceMock.findAll.mockResolvedValue([userMock]);
      const result = await controller.findAll();
      expect(result).toEqual([userMock]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un usuario por id', async () => {
      serviceMock.findById.mockResolvedValue(userMock);
      const result = await controller.findOne(userMock.id);
      expect(result).toEqual(userMock);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findById).toHaveBeenCalledWith(userMock.id);
    });
  });

  describe('update', () => {
    it('debería actualizar un usuario', async () => {
      const updateData = { nombre: 'NuevoNombre' };
      const updatedUser = { ...userMock, ...updateData };
      serviceMock.update.mockResolvedValue(updatedUser);
      const result = await controller.update(userMock.id, updateData);
      expect(result).toEqual(updatedUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith(userMock.id, updateData);
    });
  });

  describe('remove', () => {
    it('debería eliminar un usuario', async () => {
      serviceMock.remove.mockResolvedValue(undefined);
      await expect(controller.remove(userMock.id)).resolves.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith(userMock.id);
    });
  });
});
