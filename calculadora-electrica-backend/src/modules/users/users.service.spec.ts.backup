import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HashService } from '../../common/services/hash.service';
import { Repository, UpdateResult } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

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
    creationDate: new Date(),
    updateDate: new Date(),
    active: true,
    setHashService: jest.fn(),
    validatePassword: jest.fn(),
    hashedPassword: jest.fn(),
    migratePassword: jest.fn(),
    isUsingArgon2id: jest.fn(),
    needsPasswordMigration: jest.fn(),
    toJSON: jest.fn(),
  } as unknown as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: HashService,
          useValue: {
            hashPassword: jest.fn(),
            verifyPassword: jest.fn(),
            detectHashType: jest.fn(),
            isArgon2id: jest.fn(),
            isBcrypt: jest.fn(),
            migrateFromBcrypt: jest.fn(),
            getArgon2Config: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un usuario nuevo', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(userMock);
      repository.save.mockResolvedValue(userMock);
      const result = await service.create(userMock);
      expect(result).toEqual(userMock);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith(userMock);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.save).toHaveBeenCalledWith(userMock);
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      repository.findOne.mockResolvedValue(userMock);
      await expect(service.create(userMock)).rejects.toThrow(ConflictException);
    });

    it('debería lanzar ConflictException si no se provee email', async () => {
      await expect(service.create({})).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('debería retornar un usuario por email', async () => {
      repository.findOne.mockResolvedValue(userMock);
      const result = await service.findByEmail(userMock.email);
      expect(result).toEqual(userMock);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: userMock.email },
      });
    });

    it('debería lanzar NotFoundException si no se provee email', async () => {
      await expect(service.findByEmail('')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('debería retornar un usuario por id', async () => {
      repository.findOne.mockResolvedValue(userMock);
      const result = await service.findById(userMock.id);
      expect(result).toEqual(userMock);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userMock.id },
      });
    });

    it('debería lanzar NotFoundException si no encuentra el usuario', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findById('2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debería actualizar un usuario', async () => {
      repository.findOne.mockResolvedValue(userMock);
      repository.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      const updatedUser = new User();
      Object.assign(updatedUser, { ...userMock, nombre: 'NuevoNombre' });
      jest.spyOn(service, 'findById').mockResolvedValue(updatedUser);
      const result = await service.update(userMock.id, {
        nombre: 'NuevoNombre',
      });
      expect(result).toEqual(updatedUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.update).toHaveBeenCalledWith(userMock.id, {
        nombre: 'NuevoNombre',
      });
    });
  });

  describe('remove', () => {
    it('debería eliminar un usuario', async () => {
      repository.findOne.mockResolvedValue(userMock);
      repository.remove.mockResolvedValue(userMock);
      await expect(service.remove(userMock.id)).resolves.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.remove).toHaveBeenCalledWith(userMock);
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los usuarios', async () => {
      repository.find.mockResolvedValue([userMock]);
      const result = await service.findAll();
      expect(result).toEqual([userMock]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.find).toHaveBeenCalled();
    });
  });
});
