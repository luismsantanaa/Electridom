#!/usr/bin/env node

/**
 * Script para limpiar la base de datos de prueba
 * Elimina la base de datos de prueba después de ejecutar los tests
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const TEST_DB = process.env.TEST_DB_NAME || 'electridom_test';
const DB_HOST = process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '3306';
const DB_USER = process.env.TEST_DB_USERNAME || process.env.DATABASE_USERNAME || 'electridom';
const DB_PASS = process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'electridom';

async function cleanupTestDatabase() {
  let connection;
  
  try {
    console.log('🧹 Limpiando base de datos de prueba...');
    console.log(`📊 Base de datos a eliminar: ${TEST_DB}`);
    
    // Conectar a MySQL sin especificar base de datos
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
    });

    console.log('✅ Conexión establecida');

    // Verificar si la base de datos de prueba existe
    const [testDbExists] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [TEST_DB]
    );

    if (testDbExists.length === 0) {
      console.log(`ℹ️  La base de datos de prueba '${TEST_DB}' no existe`);
      return;
    }

    // Eliminar base de datos de prueba
    await connection.execute(`DROP DATABASE \`${TEST_DB}\``);
    console.log(`🗑️  Base de datos de prueba '${TEST_DB}' eliminada exitosamente`);

  } catch (error) {
    console.error('❌ Error limpiando base de datos de prueba:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupTestDatabase();
}

module.exports = { cleanupTestDatabase };
