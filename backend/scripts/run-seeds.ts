import { NestFactory } from '@nestjs/core';
import { SeedsModule } from '../src/database/seeds/seeds.module';
import { SeedsService } from '../src/database/seeds/templates/seeds.service';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function bootstrap() {
  try {
    console.log('🚀 Iniciando proceso de seeds...');

    const app = await NestFactory.createApplicationContext(SeedsModule);
    const seedsService = app.get(SeedsService);

    await seedsService.seed();

    console.log('✅ Seeds completados exitosamente');
    await app.close();
  } catch (error) {
    console.error('❌ Error al ejecutar seeds:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Error no manejado:', error);
  process.exit(1);
});
