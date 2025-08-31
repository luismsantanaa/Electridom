import { DataSource } from 'typeorm';
import { ProjectsSeed } from './seeds/projects.seed';
import { Sprint9PerformanceSeed } from './seeds/sprint-9-performance.seed';
import { ModeladoElectricoSeed } from './seeds/modelado-electrico.seed';

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
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

    // Ejecutar semillas
    const projectsSeed = new ProjectsSeed(dataSource);
    await projectsSeed.run();

    // Sprint 9: Seed de performance (opcional - comentar si no se necesita)
    if (process.env.RUN_PERFORMANCE_SEED === 'true') {
      const performanceSeed = new Sprint9PerformanceSeed(dataSource);
      await performanceSeed.run();
    }

    // Sprint 10: Seed de modelado eléctrico
    const modeladoElectricoSeed = new ModeladoElectricoSeed(dataSource);
    await modeladoElectricoSeed.run();

    console.log('✅ Todas las semillas ejecutadas exitosamente');
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
