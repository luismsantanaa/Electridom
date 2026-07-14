import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'electridom',
    entities: ['src/**/*.entity.{ts,js}'],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const migrations = await dataSource.runMigrations();
    console.log(`✅ ${migrations.length} migrations executed successfully`);

    await dataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
