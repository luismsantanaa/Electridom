import { registerAs } from '@nestjs/config';
import { Environment, LogLevel } from './env.validation';

export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env.NODE_ENV || Environment.Development,
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || LogLevel.Info,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'electridom',
  password: process.env.DATABASE_PASSWORD || 'electridom',
  database: process.env.DATABASE_NAME || 'electridom',
  url: process.env.DATABASE_URL,
}));

export const securityConfig = registerAs('security', () => ({
  apiKey: process.env.API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  sslKeyPath: process.env.SSL_KEY_PATH,
  sslCertPath: process.env.SSL_CERT_PATH,
}));

export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
}));

export const swaggerConfig = registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'Calculadora Eléctrica RD API',
  description:
    process.env.SWAGGER_DESCRIPTION ||
    'API para cálculos eléctricos según normativas dominicanas',
  version: process.env.SWAGGER_VERSION || '2.0.0',
}));

export const healthConfig = registerAs('health', () => ({
  diskPath: process.env.HEALTH_DISK_PATH || '/tmp',
  diskMinBytes: parseInt(process.env.HEALTH_DISK_MIN_BYTES || '104857600', 10), // 100 MB default
}));

export const metricsConfig = registerAs('metrics', () => ({
  enabled: process.env.METRICS_ENABLED === 'true',
  token: process.env.METRICS_TOKEN || '',
}));

export const loggerConfig = registerAs('logger', () => ({
  level: process.env.LOG_LEVEL || 'info',
  requestIdHeader: process.env.REQUEST_ID_HEADER || 'X-Request-Id',
}));

// Configuración específica por ambiente
export const getEnvironmentConfig = () => {
  const nodeEnv = process.env.NODE_ENV || Environment.Development;

  const baseConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || LogLevel.Info,
    corsOrigin: process.env.CORS_ORIGIN || '*',
  };

  switch (nodeEnv) {
    case Environment.Development:
      return {
        ...baseConfig,
        port: 3000,
        logLevel: LogLevel.Debug,
        corsOrigin: '*',
        database: {
          synchronize: true,
          logging: true,
        },
      };

    case Environment.Staging:
      return {
        ...baseConfig,
        port: 3000,
        logLevel: LogLevel.Info,
        corsOrigin:
          process.env.CORS_ORIGIN ||
          'https://staging.calculadora-electrica.com',
        database: {
          synchronize: false,
          logging: false,
        },
      };

    case Environment.Production:
      return {
        ...baseConfig,
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: LogLevel.Warn,
        corsOrigin:
          process.env.CORS_ORIGIN || 'https://calculadora-electrica.com',
        database: {
          synchronize: false,
          logging: false,
        },
        ssl: {
          enabled: !!process.env.SSL_KEY_PATH && !!process.env.SSL_CERT_PATH,
          keyPath: process.env.SSL_KEY_PATH,
          certPath: process.env.SSL_CERT_PATH,
        },
      };

    default:
      return baseConfig;
  }
};

// Función helper para obtener configuración completa
export const getConfig = () => ({
  env: envConfig(),
  jwt: jwtConfig(),
  database: databaseConfig(),
  security: securityConfig(),
  rateLimit: rateLimitConfig(),
  swagger: swaggerConfig(),
  environment: getEnvironmentConfig(),
});
