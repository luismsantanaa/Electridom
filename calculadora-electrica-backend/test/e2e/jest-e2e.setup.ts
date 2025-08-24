import { config } from 'dotenv';
import { join } from 'path';

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';

// Configurar variables de entorno por defecto para tests
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '3306';
process.env.DATABASE_USERNAME = 'electridom';
process.env.DATABASE_PASSWORD = 'electridom';
process.env.DATABASE_NAME = 'electridom'; // Usar la base de datos principal
process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests-only';
process.env.JWT_EXPIRES_IN = '900s';
process.env.REFRESH_TTL = '30d';
process.env.REFRESH_ROTATE = 'true';
process.env.REFRESH_SALT = 'test-refresh-salt-for-e2e-tests-only';
process.env.REFRESH_COOKIE_ENABLED = 'false';
process.env.RATE_LIMIT_TTL = '60';
process.env.RATE_LIMIT_LIMIT = '100';
process.env.LOG_LEVEL = 'error';
process.env.PORT = '3001';
process.env.API_KEY = 'test-api-key';
process.env.CORS_ORIGIN = '*';
process.env.SWAGGER_TITLE = 'Test API';
process.env.SWAGGER_DESCRIPTION = 'Test API Description';
process.env.SWAGGER_VERSION = '1.0.0';

// Configuración específica para tests
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '1000';

// Cargar variables de entorno de test si existe (sobrescribir las anteriores)
try {
  config({ path: join(__dirname, '.env.test') });
} catch (error) {
  console.log('No se encontró archivo .env.test, usando configuración por defecto');
}

console.log('🧪 Configurando tests E2E con base de datos:', process.env.DATABASE_NAME);
console.log('🧪 NODE_ENV configurado como:', process.env.NODE_ENV);
console.log('🧪 DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('🧪 DATABASE_PORT:', process.env.DATABASE_PORT);

// Configuración global para tests
beforeAll(async () => {
  // Configuraciones adicionales si son necesarias
  jest.setTimeout(30000);
  
  // Verificar que las variables críticas estén configuradas
  const criticalVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET'
  ];
  
  criticalVars.forEach(varName => {
    if (!process.env[varName]) {
      throw new Error(`Variable crítica no configurada: ${varName}`);
    }
  });
});

afterAll(async () => {
  console.log('🧪 E2E Tests completed');
});

// Configuración global para manejo de errores en tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
