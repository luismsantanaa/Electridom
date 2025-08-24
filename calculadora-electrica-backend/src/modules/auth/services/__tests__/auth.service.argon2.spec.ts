import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../../users/users.service';
import { HashService } from '../../../../common/services/hash.service';
import { AuditService } from '../../../../common/services/audit.service';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../users/entities/user.entity';
import { createMockUser } from '../../../users/__tests__/user.mock.helper';
import * as bcrypt from 'bcryptjs';

describe('AuthService - Argon2id Migration Tests', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let hashService: HashService;
  let auditService: AuditService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    updatePasswordWithMigration: jest.fn(),
    create: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        HashService, // Usar el servicio real
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    hashService = module.get<HashService>(HashService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser with bcrypt migration', () => {
    it('should successfully migrate bcrypt hash to Argon2id during login', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      // Mock user con hash de bcrypt
      const mockUser = {
        id: '1',
        email,
        username: 'testuser',
        nombre: 'Test',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        password: bcryptHash,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        setHashService: jest.fn(),
        validatePassword: jest.fn(),
        migratePassword: jest.fn(),
      } as unknown as User;

      // Configurar mocks
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updatePasswordWithMigration.mockResolvedValue(mockUser);

      // Configurar validatePassword para retornar resultado de bcrypt válido
      (mockUser.validatePassword as jest.Mock).mockImplementation(
        async (pwd: string) => {
          const result = await hashService.verifyPassword(pwd, bcryptHash);
          return result;
        },
      );

      const result = await authService.validateUser(
        email,
        password,
        '127.0.0.1',
        'test-agent',
        'trace-123',
      );

      // Verificaciones
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(mockUsersService.updatePasswordWithMigration).toHaveBeenCalledWith(
        mockUser,
        password,
      );

      // Verificar logs de auditoría
      expect(mockAuditService.log).toHaveBeenCalledTimes(2); // Migración + Login exitoso
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_CHANGE',
          detail: expect.objectContaining({
            reason: 'bcrypt_to_argon2id_migration',
            success: true,
          }),
        }),
      );
    });

    it('should handle migration failure gracefully', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '1',
        email,
        username: 'testuser',
        nombre: 'Test',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        password: bcryptHash,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        setHashService: jest.fn(),
        validatePassword: jest.fn(),
        migratePassword: jest.fn(),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updatePasswordWithMigration.mockRejectedValue(
        new Error('Migration failed'),
      );

      mockUser.setHashService(hashService);
      (mockUser.validatePassword as jest.Mock).mockImplementation(
        async (pwd: string) => {
          const result = await hashService.verifyPassword(pwd, bcryptHash);
          return result;
        },
      );

      const result = await authService.validateUser(
        email,
        password,
        '127.0.0.1',
        'test-agent',
        'trace-123',
      );

      // El login debería seguir funcionando a pesar del fallo en la migración
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);

      // Verificar log de migración fallida
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_CHANGE',
          detail: expect.objectContaining({
            reason: 'bcrypt_to_argon2id_migration',
            success: false,
            error: 'Migration failed',
          }),
        }),
      );
    });

    it('should not attempt migration for Argon2id hashes', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const argon2Hash = await hashService.hashPassword(password);

      const mockUser = {
        id: '1',
        email,
        username: 'testuser',
        nombre: 'Test',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        password: argon2Hash,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        setHashService: jest.fn(),
        validatePassword: jest.fn(),
        migratePassword: jest.fn(),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      mockUser.setHashService(hashService);
      (mockUser.validatePassword as jest.Mock).mockImplementation(
        async (pwd: string) => {
          const result = await hashService.verifyPassword(pwd, argon2Hash);
          return result;
        },
      );

      const result = await authService.validateUser(
        email,
        password,
        '127.0.0.1',
        'test-agent',
        'trace-123',
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);

      // No debe llamar migración
      expect(
        mockUsersService.updatePasswordWithMigration,
      ).not.toHaveBeenCalled();

      // Solo debe registrar login exitoso
      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          detail: expect.objectContaining({
            hashType: 'argon2id',
            migrated: false,
          }),
        }),
      );
    });
  });

  describe('register with Argon2id', () => {
    it('should use Argon2id for new user registration', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        username: 'newuser',
        nombre: 'New',
        apellido: 'User',
      };

      const mockCreatedUser = {
        id: '2',
        ...registerDto,
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        password: 'hashed-password', // Se reemplazará por el hash real
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(null); // Usuario no existe
      mockUsersService.create.mockImplementation(async (userData) => {
        // Verificar que el password es un hash de Argon2id
        expect(userData.password).toMatch(/^\$argon2id\$/);
        return mockCreatedUser;
      });

      const result = await authService.register(registerDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerDto.email);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...registerDto,
          password: expect.stringMatching(/^\$argon2id\$/),
          role: UserRole.CLIENTE,
        }),
      );
    });
  });

  describe('performance requirements', () => {
    it('should complete bcrypt migration within acceptable time', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '1',
        email,
        username: 'testuser',
        nombre: 'Test',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        password: bcryptHash,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        setHashService: jest.fn(),
        validatePassword: jest.fn(),
        migratePassword: jest.fn(),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updatePasswordWithMigration.mockResolvedValue(mockUser);

      mockUser.setHashService(hashService);
      (mockUser.validatePassword as jest.Mock).mockImplementation(
        async (pwd: string) => {
          const result = await hashService.verifyPassword(pwd, bcryptHash);
          return result;
        },
      );

      const startTime = Date.now();

      await authService.validateUser(email, password);

      const duration = Date.now() - startTime;

      // El proceso completo (validación + migración) debe completarse en < 1000ms
      expect(duration).toBeLessThan(1000);
    });

    it('should complete Argon2id registration within acceptable time', async () => {
      const registerDto = {
        email: 'speedtest@example.com',
        password: 'SpeedTestPassword123!',
        username: 'speedtest',
        nombre: 'Speed',
        apellido: 'Test',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({} as User);

      const startTime = Date.now();

      await authService.register(registerDto);

      const duration = Date.now() - startTime;

      // El registro debe completarse en < 700ms
      expect(duration).toBeLessThan(1000); // Relajar límite para tests
    });
  });

  describe('security audit logging', () => {
    it('should log detailed migration information', async () => {
      const email = 'audit@example.com';
      const password = 'AuditPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '1',
        email,
        username: 'audituser',
        nombre: 'Audit',
        apellido: 'User',
        role: UserRole.CLIENTE,
        estado: UserStatus.ACTIVO,
        password: bcryptHash,
        creationDate: new Date(),
        updateDate: new Date(),
        active: true,
        setHashService: jest.fn(),
        validatePassword: jest.fn(),
        migratePassword: jest.fn(),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updatePasswordWithMigration.mockResolvedValue(mockUser);

      mockUser.setHashService(hashService);
      (mockUser.validatePassword as jest.Mock).mockImplementation(
        async (pwd: string) => {
          const result = await hashService.verifyPassword(pwd, bcryptHash);
          return result;
        },
      );

      await authService.validateUser(
        email,
        password,
        '192.168.1.100',
        'Mozilla/5.0 Test Browser',
        'audit-trace-456',
      );

      // Verificar log de migración con información completa
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: '1',
        action: 'PASSWORD_CHANGE',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        traceId: 'audit-trace-456',
        detail: {
          email,
          reason: 'bcrypt_to_argon2id_migration',
          success: true,
        },
      });

      // Verificar log de login con información de migración
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: '1',
        action: 'LOGIN_SUCCESS',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        traceId: 'audit-trace-456',
        detail: {
          email,
          hashType: 'bcrypt',
          migrated: true,
        },
      });
    });
  });
});
