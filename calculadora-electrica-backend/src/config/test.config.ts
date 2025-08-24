import { registerAs } from '@nestjs/config';

export const testDatabaseConfig = registerAs('testDatabase', () => ({
  host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '3306', 10),
  username: process.env.TEST_DB_USERNAME || process.env.DATABASE_USERNAME || 'electridom',
  password: process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'electridom',
  database: process.env.TEST_DB_NAME || 'electridom_test',
  url: process.env.TEST_DATABASE_URL,
}));

export const testJwtConfig = registerAs('testJwt', () => ({
  secret: process.env.TEST_JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
  expiresIn: process.env.TEST_JWT_EXPIRES_IN || '1h',
}));

export const testSecurityConfig = registerAs('testSecurity', () => ({
  apiKey: process.env.TEST_API_KEY || 'test-api-key',
  corsOrigin: process.env.TEST_CORS_ORIGIN || '*',
}));

export const testRateLimitConfig = registerAs('testRateLimit', () => ({
  ttl: parseInt(process.env.TEST_RATE_LIMIT_TTL || '60', 10),
  limit: parseInt(process.env.TEST_RATE_LIMIT_LIMIT || '1000', 10),
}));

export const getTestConfig = () => ({
  testDatabase: testDatabaseConfig(),
  testJwt: testJwtConfig(),
  testSecurity: testSecurityConfig(),
  testRateLimit: testRateLimitConfig(),
});
