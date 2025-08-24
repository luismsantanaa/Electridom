import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export default new DataSource({
  type: 'mariadb',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'electridom',
  password: process.env.DATABASE_PASSWORD || 'electridom',
  database: process.env.DATABASE_NAME || 'electridom',
  charset: 'utf8mb4',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    charset: 'utf8mb4_unicode_ci',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },
});
