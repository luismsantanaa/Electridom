import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'electridom',
    password: process.env.DATABASE_PASSWORD || 'electridom',
    database: process.env.DATABASE_NAME || 'electridom',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    // NOTE: ProjectsSeed, Sprint9PerformanceSeed, ModeladoElectricoSeed were
    // removed because the _archive/ folder no longer exists. Use the
    // SeedsService (npm run seed) for active seeding.
    console.warn('run-seeds: archived seed classes no longer exist. Use `npm run seed`.');
  } catch (error) {
    console.error('❌ Error ejecutando semillas:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
