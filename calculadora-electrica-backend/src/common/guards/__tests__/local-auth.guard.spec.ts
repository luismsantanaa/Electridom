import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from '../local-auth.guard';
import { PassportStrategy } from '@nestjs/passport';

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn(),
  AuthGuard: () =>
    function () {
      return {
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          if (req.body?.email && req.body?.password) {
            return true;
          }
          return false;
        },
      };
    },
}));

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when credentials are valid', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example.com',
              password: 'password123',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when credentials are missing', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {},
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when request has incomplete credentials', () => {
      const mockRequest = {
        body: {
          email: 'test@example.com',
        },
      };
      const mockHttpContext = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };
      const mockExecutionContext =
        mockHttpContext as unknown as ExecutionContext;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });
});
