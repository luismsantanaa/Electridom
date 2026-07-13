import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Configuración específica para desarrollo
  enableDebug: true,
  enableLogging: true,
  // Configuración de base de datos (para referencia)
  dbConfig: {
    host: 'localhost',
    port: 3306,
    user: 'electridom',
    password: 'electridom123',
    database: 'electridom'
  }
};
