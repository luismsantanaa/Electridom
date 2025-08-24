export const testConfig = {
  database: {
    host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '3306', 10),
    username: process.env.TEST_DB_USERNAME || process.env.DATABASE_USERNAME || 'electridom',
    password: process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'electridom',
    database: process.env.TEST_DB_NAME || 'electridom_test', // Base de datos de prueba
    synchronize: true,
    logging: false,
  },
  application: {
    port: parseInt(process.env.TEST_PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
  },
  security: {
    throttleTtl: parseInt(process.env.TEST_THROTTLE_TTL || '60', 10),
    throttleLimit: parseInt(process.env.TEST_THROTTLE_LIMIT || '1000', 10),
    authThrottleLimit: parseInt(process.env.TEST_AUTH_THROTTLE_LIMIT || '10', 10),
  },
  rules: {
    cacheTtlMs: parseInt(process.env.TEST_RULE_CACHE_TTL_MS || '1000', 10),
    applyMigrationsOnStartup: true,
  },
  jwt: {
    secret: process.env.TEST_JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    expiresIn: process.env.TEST_JWT_EXPIRES_IN || '1h',
  },
};
