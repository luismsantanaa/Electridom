// Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.TEST_DB_HOST = 'localhost';
process.env.TEST_DB_PORT = '3306';
process.env.TEST_DB_USERNAME = 'electridom_test';
process.env.TEST_DB_PASSWORD = 'electridom_test';
process.env.TEST_DB_NAME = 'electridom_test';
process.env.TEST_PORT = '3001';
process.env.TEST_JWT_SECRET = 'test-secret-key-for-ci';
process.env.TEST_JWT_EXPIRES_IN = '1h';
process.env.TEST_THROTTLE_TTL = '60';
process.env.TEST_THROTTLE_LIMIT = '10';

// Configuración de Jest
jest.setTimeout(30000);

// Mock de console.log para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
