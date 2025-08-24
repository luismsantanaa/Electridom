#!/usr/bin/env node

/**
 * Script completo para configurar la base de datos de prueba
 * Incluye migraciones y seeds
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno
dotenv.config();

async function setupTestDatabase() {
  console.log('🔧 Configurando base de datos de prueba completa...');

  // Configurar DataSource para la base de datos de prueba
  const testDataSource = new DataSource({
    type: 'mariadb',
    host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(
      process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '3306',
    ),
    username:
      process.env.TEST_DB_USERNAME ||
      process.env.DATABASE_USERNAME ||
      'electridom',
    password:
      process.env.TEST_DB_PASSWORD ||
      process.env.DATABASE_PASSWORD ||
      'electridom',
    database: process.env.TEST_DB_NAME || 'electridom_test',
    entities: [join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
    synchronize: true, // Usar synchronize para crear tablas automáticamente
    logging: true,
    charset: 'utf8mb4',
    extra: {
      charset: 'utf8mb4_unicode_ci',
    },
  });

  try {
    console.log('📊 Conectando a la base de datos de prueba...');
    await testDataSource.initialize();
    console.log('✅ Conexión establecida');

    // Las tablas se crean automáticamente con synchronize: true
    console.log('🔄 Tablas creadas automáticamente con synchronize...');

    // Ejecutar seeds
    console.log('🌱 Ejecutando seeds...');
    await runSeeds(testDataSource);
    console.log('✅ Seeds ejecutados exitosamente');

    await testDataSource.destroy();
    console.log('🎉 Base de datos de prueba configurada completamente!');
    console.log(
      `📊 Base de datos: ${process.env.TEST_DB_NAME || 'electridom_test'}`,
    );
    console.log(
      `🔗 Host: ${process.env.TEST_DB_HOST || 'localhost'}:${process.env.TEST_DB_PORT || '3306'}`,
    );
  } catch (error) {
    console.error('❌ Error configurando base de datos de prueba:', error);
    process.exit(1);
  }
}

async function runSeeds(dataSource: DataSource) {
  try {
    // Crear un SeedsService simple sin dependencias de NestJS
    const seedsService = new SimpleSeedsService(dataSource);
    
    console.log('  📋 Ejecutando seeds de tipos de instalación...');
    await seedsService.seedTiposInstalaciones();
    
    console.log('  📋 Ejecutando seeds de tipos de ambientes...');
    await seedsService.seedTiposAmbientes();
    
    console.log('  📋 Ejecutando seeds de tipos de artefactos...');
    await seedsService.seedTiposArtefactos();
    
    console.log('  ✅ Todos los seeds ejecutados correctamente');
    
  } catch (error) {
    console.error('  ❌ Error ejecutando seeds:', error);
    throw error;
  }
}

class SimpleSeedsService {
  constructor(private dataSource: DataSource) {}

  async seedTiposInstalaciones(): Promise<void> {
    const tiposInstalaciones = [
      { id: '1', nombre: 'Residencial', descripcion: 'Instalaciones residenciales', active: true },
      { id: '2', nombre: 'Comercial', descripcion: 'Instalaciones comerciales', active: true },
      { id: '3', nombre: 'Industrial', descripcion: 'Instalaciones industriales', active: true },
    ];

    for (const tipo of tiposInstalaciones) {
      await this.dataSource.query(
        'INSERT IGNORE INTO tipos_instalaciones (id, nombre, descripcion, active) VALUES (?, ?, ?, ?)',
        [tipo.id, tipo.nombre, tipo.descripcion, tipo.active]
      );
    }
    console.log('    ✅ Tipos de instalación sembrados');
  }

  async seedTiposAmbientes(): Promise<void> {
    const tiposAmbientes = [
      { id: '1', nombre: 'Sala', descripcion: 'Sala de estar', active: true },
      { id: '2', nombre: 'Cocina', descripcion: 'Cocina', active: true },
      { id: '3', nombre: 'Dormitorio', descripcion: 'Dormitorio', active: true },
      { id: '4', nombre: 'Baño', descripcion: 'Baño', active: true },
      { id: '5', nombre: 'Oficina', descripcion: 'Oficina', active: true },
    ];

    for (const tipo of tiposAmbientes) {
      await this.dataSource.query(
        'INSERT IGNORE INTO tipos_ambientes (id, nombre, descripcion, active) VALUES (?, ?, ?, ?)',
        [tipo.id, tipo.nombre, tipo.descripcion, tipo.active]
      );
    }
    console.log('    ✅ Tipos de ambientes sembrados');
  }

  async seedTiposArtefactos(): Promise<void> {
    const tiposArtefactos = [
      { id: '1', nombre: 'Televisor', descripcion: 'Televisor LED', potenciaNominal: 120, factorDemanda: 0.8, active: true },
      { id: '2', nombre: 'Refrigerador', descripcion: 'Refrigerador doméstico', potenciaNominal: 150, factorDemanda: 0.7, active: true },
      { id: '3', nombre: 'Lámpara', descripcion: 'Lámpara LED', potenciaNominal: 15, factorDemanda: 1.0, active: true },
      { id: '4', nombre: 'Computadora', descripcion: 'Computadora de escritorio', potenciaNominal: 200, factorDemanda: 0.9, active: true },
      { id: '5', nombre: 'Aire Acondicionado', descripcion: 'Aire acondicionado', potenciaNominal: 1500, factorDemanda: 0.8, active: true },
    ];

    for (const tipo of tiposArtefactos) {
      await this.dataSource.query(
        'INSERT IGNORE INTO tipos_artefactos (id, nombre, descripcion, potenciaNominal, factorDemanda, active) VALUES (?, ?, ?, ?, ?, ?)',
        [tipo.id, tipo.nombre, tipo.descripcion, tipo.potenciaNominal, tipo.factorDemanda, tipo.active]
      );
    }
    console.log('    ✅ Tipos de artefactos sembrados');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupTestDatabase();
}

export { setupTestDatabase };
