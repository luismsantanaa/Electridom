#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KeyStoreService } from '../src/modules/jwks/services/key-store.service';
import { Logger } from '@nestjs/common';

async function rotateKeys() {
  const logger = new Logger('RotateKeysCLI');

  try {
    logger.log('Iniciando aplicación para rotación de claves...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const keyStoreService = app.get(KeyStoreService);

    logger.log('Rotando claves RSA...');
    const newKey = await keyStoreService.rotateKeys();

    logger.log(`✅ Clave RSA rotada exitosamente`);
    logger.log(`   KID: ${newKey.kid}`);
    logger.log(`   Tipo: ${newKey.type}`);
    logger.log(`   Activa: ${newKey.isActive}`);
    logger.log(`   Creada: ${newKey.createdAt}`);

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante la rotación de claves:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  rotateKeys();
}
