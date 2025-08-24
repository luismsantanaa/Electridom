/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { LoginDto } from '../../dtos/login.dto';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../users/entities/user.entity';
import { createMockUser } from '../../../users/__tests__/user.mock.helper';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser({
        email: 'test@example.com',
      });

      const mockToken = {
        access_token: 'mock-jwt-token',
        user: mockUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockToken);

      const mockRequest = {
        headers: {
          'user-agent': 'test-agent',
          'x-trace-id': 'test-trace-id',
        },
      };

      const result = await controller.login(
        loginDto,
        '127.0.0.1',
        mockRequest as any,
      );

      expect(result).toEqual(mockToken);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        '127.0.0.1',
        'test-agent',
        'test-trace-id',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      const mockRequest = {
        headers: {
          'user-agent': 'test-agent',
          'x-trace-id': 'test-trace-id',
        },
      };

      await expect(
        controller.login(loginDto, '127.0.0.1', mockRequest as any),
      ).rejects.toThrow();
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        '127.0.0.1',
        'test-agent',
        'test-trace-id',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
      });

      const result = controller.getProfile({ user: mockUser });
      expect(result).toEqual(mockUser);
    });
  });
});
