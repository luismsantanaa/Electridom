import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    function createMockContext(role: string) {
      return {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role },
          }),
        }),
      } as unknown as ExecutionContext;
    }

    it('should return true when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      const mockContext = createMockContext('admin');
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const mockContext = createMockContext('admin');
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const mockContext = createMockContext('cliente');
      const result = guard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });
});
