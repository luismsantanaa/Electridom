import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../jwt.strategy';
import { UsersService } from '../../../modules/users/users.service';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../modules/users/entities/user.entity';
import { createMockUser } from '../../../modules/users/__tests__/user.mock.helper';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when token is valid', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.CLIENTE,
      };

      const mockUser = createMockUser({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
      });

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(
        payload.sub.toString(),
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      const payload = {
        sub: 999,
        email: 'nonexistent@example.com',
        role: UserRole.CLIENTE,
      };

      mockUsersService.findById.mockResolvedValue(null);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(
        payload.sub.toString(),
      );
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const payload = {
        sub: 1,
        email: 'inactive@example.com',
        role: UserRole.CLIENTE,
      };

      const mockInactiveUser = createMockUser({
        id: '1',
        username: 'inactiveuser',
        email: 'inactive@example.com',
        nombre: 'Inactive',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.INACTIVO,
        active: false,
      });

      mockUsersService.findById.mockResolvedValue(mockInactiveUser);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(
        payload.sub.toString(),
      );
      expect(result).toBeNull();
    });
  });
});
