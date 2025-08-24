/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../../users/users.service';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../users/entities/user.entity';
import { AuditService } from '../../../../common/services/audit.service';
import { HashService } from '../../../../common/services/hash.service';
import {
  createMockUser,
  createMockUserWithInvalidPassword,
} from '../../../users/__tests__/user.mock.helper';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockHashService = {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    isBcrypt: jest.fn(),
    isArgon2id: jest.fn(),
    migrateFromBcrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = createMockUser({ email });

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(password);
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
      );
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const mockUser = createMockUserWithInvalidPassword({ email });

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token for valid user', async () => {
      const mockUser = createMockUser();
      const mockToken = 'mock-jwt-token';

      mockJwtService.sign.mockReturnValue(mockToken);
      mockConfigService.get.mockReturnValue('1h');

      const result = service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
      });
    });
  });
});
