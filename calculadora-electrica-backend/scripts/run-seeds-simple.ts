import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { normConstSeed } from '../src/database/seeds/norm-const.seed';
import { demandFactorSeed } from '../src/database/seeds/demand-factor.seed';
import { seedResistivity } from '../src/database/seeds/resistivity.seed';
import { seedGroundingRules } from '../src/database/seeds/grounding-rules.seed';

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

    // Ejecutar seeds en orden
    await normConstSeed(dataSource);
    await demandFactorSeed(dataSource);
    await seedResistivity(dataSource);
    await seedGroundingRules(dataSource);
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
