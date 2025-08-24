import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { PassportStrategy } from '@nestjs/passport';

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockImplementation((req, options) => {
      if (req.user) {
        return true;
      }
      return false;
    }),
  })),
  AuthGuard: () =>
    function () {
      return {
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          return req.headers?.authorization === 'Bearer valid-token';
        },
      };
    },
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return false when request has no authorization header', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return false when request has invalid authorization format', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'invalid-format',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });
});
