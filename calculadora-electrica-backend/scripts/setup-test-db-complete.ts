/**
 * Setup complete test database with migrations and seeds
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: '.env.test' });

async function setupTestDb() {
  console.log('Setting up test database...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USERNAME || 'electridom_test',
    password: process.env.TEST_DB_PASSWORD || 'electridom_test',
    database: process.env.TEST_DB_NAME || 'electridom_test',
    entities: [join(__dirname, '..', 'src', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'src', 'database', 'migrations', '*.{ts,.js}')],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Connected to test database');

    // Run migrations
    const migrations = await dataSource.runMigrations();
    console.log(`✓ Ran ${migrations.length} migrations`);

    console.log('✓ Test database setup complete');
  } catch (error) {
    console.error('✗ Error setting up test database:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

setupTestDb();
