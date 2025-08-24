import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from '../local.strategy';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user when credentials are valid', async () => {
      const mockUser = { id: '1', email };
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
