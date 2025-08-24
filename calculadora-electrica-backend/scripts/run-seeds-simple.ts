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
    console.log('🔌 Conectado a la base de datos');

    // Ejecutar seeds en orden
    console.log('🌱 Ejecutando seeds...');

    await normConstSeed(dataSource);
    console.log('✅ NormConst seed completado');

    await demandFactorSeed(dataSource);
    console.log('✅ DemandFactor seed completado');

    await seedResistivity(dataSource);
    console.log('✅ Resistivity seed completado');

    await seedGroundingRules(dataSource);
    console.log('✅ GroundingRules seed completado');

    console.log('🎉 Todos los seeds completados exitosamente');
  } catch (error) {
    console.error('❌ Error durante la ejecución de seeds:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds().catch(console.error);
