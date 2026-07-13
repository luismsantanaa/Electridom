import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    username: process.env.DATABASE_USERNAME || 'electridom',
    password: process.env.DATABASE_PASSWORD || 'electridom',
    database: process.env.DATABASE_NAME || 'electridom',
    synchronize: false,
    logging: true,
    entities: ['src/**/*.entity.ts'],
  });

  try {
    await dataSource.initialize();

    // NOTE: individual seed functions (normConstSeed, demandFactorSeed,
    // seedResistivity, seedGroundingRules) were removed because the
    // _archive/ folder no longer exists. Use `npm run seed` instead.
    console.warn('run-seeds-simple: seed functions moved to SeedsService. Use `npm run seed`.');
  } catch (error) {
    console.error('Error during seeds execution:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds().catch((error) => {
  console.error('Failed to run seeds:', error);
  process.exit(1);
});
