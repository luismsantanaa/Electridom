import { User, UserRole, UserStatus } from '../entities/user.entity';

/**
 * Helper para crear mocks de User correctos y reutilizables
 * Incluye todos los métodos y propiedades requeridos por la entidad User
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const mockUser = {
    // Propiedades de BaseAuditEntity
    id: '1',
    usrCreate: 'test',
    usrUpdate: 'test',
    creationDate: new Date(),
    updateDate: new Date(),
    active: true,

    // Propiedades específicas de User
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    nombre: 'Test',
    apellido: 'User',
    role: UserRole.CLIENTE,
    estado: UserStatus.ACTIVO,
    telefono: null,
    empresa: null,
    cedula: null,
    ultimoAcceso: null,

    // Métodos requeridos por User
    setHashService: jest.fn(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn().mockResolvedValue({
      hash: 'validHash',
      type: 'argon2id',
      needsMigration: false,
    }),
    hashedPassword: jest.fn(),
    migratePassword: jest.fn(),
    isUsingArgon2id: jest.fn().mockReturnValue(true),
    needsPasswordMigration: jest.fn().mockReturnValue(false),
    toJSON: jest.fn().mockReturnValue({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
      role: UserRole.CLIENTE,
      estado: UserStatus.ACTIVO,
      usrCreate: 'test',
      usrUpdate: 'test',
      creationDate: expect.any(Date),
      updateDate: expect.any(Date),
      active: true,
    }),

    ...overrides,
  } as unknown as User;

  return mockUser;
};

/**
 * Mock de User para casos específicos donde la contraseña es inválida
 */
export const createMockUserWithInvalidPassword = (
  overrides: Partial<User> = {},
): User => {
  return createMockUser({
    validatePassword: jest.fn().mockResolvedValue({
      hash: null,
      type: 'argon2id',
      needsMigration: false,
    }),
    ...overrides,
  });
};

/**
 * Mock de User para casos donde se necesita migración de bcrypt
 */
export const createMockUserWithBcryptPassword = (
  overrides: Partial<User> = {},
): User => {
  return createMockUser({
    validatePassword: jest.fn().mockResolvedValue({
      hash: 'validHash',
      type: 'bcrypt',
      needsMigration: true,
    }),
    isUsingArgon2id: jest.fn().mockReturnValue(false),
    needsPasswordMigration: jest.fn().mockReturnValue(true),
    ...overrides,
  });
};
