#!/usr/bin/env node

/**
 * Script para configurar la base de datos de prueba
 * Crea una copia de la base de datos de producción con sufijo "_test"
 * Usa Docker si está disponible, sino intenta conexión directa
 */

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

const PROD_DB = process.env.DATABASE_NAME || 'electridom';
const TEST_DB = process.env.TEST_DB_NAME || 'electridom_test';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '3306';
const DB_USER = process.env.DATABASE_USERNAME || 'electridom';
const DB_PASS = process.env.DATABASE_PASSWORD || 'electridom';

async function checkDockerAvailable() {
  try {
    await execAsync('docker --version');
    return true;
  } catch (error) {
    return false;
  }
}

async function setupTestDatabaseWithDocker() {
  console.log('🐳 Usando Docker para configurar base de datos de prueba...');

  try {
    // Verificar si el contenedor de MariaDB está corriendo
    const { stdout: containers } = await execAsync(
      'docker ps --filter "name=electridom-mariadb" --format "{{.Names}}"',
    );

    if (!containers.includes('electridom-mariadb')) {
      console.log('🚀 Iniciando contenedor de MariaDB...');
      await execAsync('docker-compose up -d mariadb');

      // Esperar a que MariaDB esté listo
      console.log('⏳ Esperando a que MariaDB esté listo...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // Conectar usando root para crear la base de datos de prueba
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: 'root',
      password: 'rootpassword', // Usar contraseña de root del docker-compose
    });

    console.log('✅ Conexión establecida con Docker MariaDB');

    // Verificar si la base de datos de producción existe
    const [prodDbExists] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [PROD_DB],
    );

    if (prodDbExists.length === 0) {
      console.log(
        `⚠️  La base de datos de producción '${PROD_DB}' no existe, creando estructura básica...`,
      );

      // Crear base de datos de producción si no existe
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${PROD_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );

      // Dar permisos al usuario electridom
      await connection.execute(
        `GRANT ALL PRIVILEGES ON \`${PROD_DB}\`.* TO '${DB_USER}'@'%'`,
      );
      await connection.execute('FLUSH PRIVILEGES');

      console.log(`✅ Base de datos de producción '${PROD_DB}' creada`);
    } else {
      console.log(`✅ Base de datos de producción '${PROD_DB}' encontrada`);
    }

    // Eliminar base de datos de prueba si existe
    await connection.execute(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    console.log(`🗑️  Base de datos de prueba anterior eliminada (si existía)`);

    // Crear nueva base de datos de prueba
    await connection.execute(
      `CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Base de datos de prueba '${TEST_DB}' creada`);

    // Dar permisos al usuario electridom para la base de datos de prueba
    await connection.execute(
      `GRANT ALL PRIVILEGES ON \`${TEST_DB}\`.* TO '${DB_USER}'@'%'`,
    );
    await connection.execute('FLUSH PRIVILEGES');
    console.log(`✅ Permisos otorgados para '${TEST_DB}'`);

    // Si la base de datos de producción tiene datos, copiarlos
    if (prodDbExists.length > 0) {
      console.log('📋 Copiando estructura y datos...');

      // Obtener todas las tablas de la base de datos de producción
      const [tables] = await connection.execute(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
        [PROD_DB],
      );

      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        console.log(`  📋 Copiando tabla: ${tableName}`);

        try {
          // Obtener estructura de la tabla
          const [createTable] = await connection.execute(
            `SHOW CREATE TABLE \`${PROD_DB}\`.\`${tableName}\``,
          );

          // Crear tabla en la base de datos de prueba
          await connection.execute(
            createTable[0]['Create Table'].replace(PROD_DB, TEST_DB),
          );

          // Copiar datos usando mysqldump y mysql
          console.log(`    📋 Copiando datos de ${tableName}...`);

          // Usar mysqldump para exportar datos
          const dumpCommand = `docker exec electridom-mariadb mysqldump -u root -prootpassword ${PROD_DB} ${tableName} --no-create-info --skip-add-locks --skip-comments --skip-set-charset`;
          const { stdout: dumpData } = await execAsync(dumpCommand);

          if (dumpData.trim()) {
            // Importar datos a la base de datos de prueba
            const importCommand = `docker exec -i electridom-mariadb mysql -u root -prootpassword ${TEST_DB}`;
            await execAsync(importCommand, { input: dumpData });
            console.log(`    ✅ Datos copiados para ${tableName}`);
          } else {
            console.log(`    ℹ️  Tabla ${tableName} vacía`);
          }
        } catch (tableError) {
          console.log(
            `    ⚠️  Error copiando tabla ${tableName}: ${tableError.message}`,
          );
          console.log(`    ℹ️  Continuando con siguiente tabla...`);
        }
      }
    }

    await connection.end();
    console.log(
      '🎉 Base de datos de prueba configurada exitosamente con Docker!',
    );
    console.log(`📊 Base de datos: ${TEST_DB}`);
    console.log(`🔗 Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`👤 Usuario: ${DB_USER}`);
  } catch (error) {
    console.error(
      '❌ Error configurando base de datos de prueba con Docker:',
      error.message,
    );
    throw error;
  }
}

async function setupTestDatabaseDirect() {
  console.log(
    '🔌 Usando conexión directa para configurar base de datos de prueba...',
  );

  let connection;

  try {
    // Intentar conectar como root primero
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: 'root',
      password: 'rootpassword',
    });

    console.log('✅ Conexión establecida como root');

    // Verificar si la base de datos de producción existe
    const [prodDbExists] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [PROD_DB],
    );

    if (prodDbExists.length === 0) {
      throw new Error(
        `❌ La base de datos de producción '${PROD_DB}' no existe`,
      );
    }

    console.log(`✅ Base de datos de producción '${PROD_DB}' encontrada`);

    // Eliminar base de datos de prueba si existe
    await connection.execute(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    console.log(`🗑️  Base de datos de prueba anterior eliminada (si existía)`);

    // Crear nueva base de datos de prueba
    await connection.execute(
      `CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Base de datos de prueba '${TEST_DB}' creada`);

    // Copiar estructura y datos de la base de datos de producción
    console.log('📋 Copiando estructura y datos...');

    // Obtener todas las tablas de la base de datos de producción
    const [tables] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
      [PROD_DB],
    );

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  📋 Copiando tabla: ${tableName}`);

      try {
        // Obtener estructura de la tabla
        const [createTable] = await connection.execute(
          `SHOW CREATE TABLE \`${PROD_DB}\`.\`${tableName}\``,
        );

        // Crear tabla en la base de datos de prueba
        await connection.execute(
          createTable[0]['Create Table'].replace(PROD_DB, TEST_DB),
        );

        // Copiar datos
        const [rows] = await connection.execute(
          `SELECT * FROM \`${PROD_DB}\`.\`${tableName}\``,
        );
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const insertQuery = `INSERT INTO \`${TEST_DB}\`.\`${tableName}\` (${columns.map((col) => `\`${col}\``).join(', ')}) VALUES (${placeholders})`;

          for (const row of rows) {
            await connection.execute(insertQuery, Object.values(row));
          }
          console.log(`    ✅ ${rows.length} registros copiados`);
        } else {
          console.log(`    ℹ️  Tabla vacía`);
        }
      } catch (tableError) {
        console.log(
          `    ⚠️  Error copiando tabla ${tableName}: ${tableError.message}`,
        );
        console.log(`    ℹ️  Continuando con siguiente tabla...`);
      }
    }

    console.log('🎉 Base de datos de prueba configurada exitosamente!');
    console.log(`📊 Base de datos: ${TEST_DB}`);
    console.log(`🔗 Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`👤 Usuario: ${DB_USER}`);
  } catch (error) {
    console.error(
      '❌ Error configurando base de datos de prueba:',
      error.message,
    );
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function setupTestDatabase() {
  try {
    console.log('🔧 Configurando base de datos de prueba...');
    console.log(`📊 Base de datos de producción: ${PROD_DB}`);
    console.log(`🧪 Base de datos de prueba: ${TEST_DB}`);

    const dockerAvailable = await checkDockerAvailable();

    if (dockerAvailable) {
      await setupTestDatabaseWithDocker();
    } else {
      await setupTestDatabaseDirect();
    }
  } catch (error) {
    console.error(
      '❌ Error configurando base de datos de prueba:',
      error.message,
    );
    console.log('💡 Sugerencias:');
    console.log('   - Verifica que MariaDB esté corriendo');
    console.log('   - Verifica las credenciales en .env');
    console.log('   - Si usas Docker, ejecuta: docker-compose up -d mariadb');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
