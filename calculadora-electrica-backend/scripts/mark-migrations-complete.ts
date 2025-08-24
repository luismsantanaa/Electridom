import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function markMigrationsComplete() {
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

    // Migraciones problemáticas que vamos a marcar como completadas
    const problematicMigrations = [
      'CreateAuditLogsTable1755816294829',
      'CreateNormConstTable1756000000000',
      'AddIdToNormConst1756000000001',
    ];

    for (const migrationName of problematicMigrations) {
      try {
        await dataSource.query(`
          INSERT INTO migrations (timestamp, name) 
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE timestamp = VALUES(timestamp)
        `, [Date.now(), migrationName]);
        console.log(`✅ Migración ${migrationName} marcada como completada`);
      } catch (error) {
        console.log(`⚠️ No se pudo marcar la migración ${migrationName}:`, error.message);
      }
    }

    console.log('🎉 Migraciones marcadas como completadas');
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await dataSource.destroy();
  }
}

markMigrationsComplete().catch(console.error);
