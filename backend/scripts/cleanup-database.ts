import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function cleanupDatabase() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    username: process.env.DATABASE_USERNAME || 'electridom',
    password: process.env.DATABASE_PASSWORD || 'electridom',
    database: process.env.DATABASE_NAME || 'electridom',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('🔌 Conectado a la base de datos');

    // Eliminar tablas problemáticas si existen
    const tablesToDrop = [
      'norm_const',
      'grounding_rules',
      'resistivity',
      'breaker_curve',
      'ampacity',
      'demand_factor',
    ];

    for (const table of tablesToDrop) {
      try {
        await dataSource.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✅ Tabla ${table} eliminada`);
      } catch (error) {
        console.log(`⚠️ No se pudo eliminar la tabla ${table}:`, error.message);
      }
    }

    // Eliminar registros de migraciones problemáticas
    try {
      await dataSource.query(`
        DELETE FROM typeorm_metadata 
        WHERE name IN (
          'CreateNormConstTable1756000000000',
          'AddIdToNormConst1756000000001'
        )
      `);
      console.log('✅ Registros de migración eliminados');
    } catch (error) {
      console.log('⚠️ No se pudieron eliminar registros de migración:', error.message);
    }

    console.log('🎉 Limpieza completada');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await dataSource.destroy();
  }
}

cleanupDatabase().catch(console.error);
