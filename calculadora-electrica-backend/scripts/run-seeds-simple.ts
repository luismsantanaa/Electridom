import { NestFactory } from '@nestjs/core';
import { SeedsModule } from '../src/database/seeds/seeds.module';
import { SeedsService } from '../src/database/seeds/templates/seeds.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedsModule);
  const seedsService = app.get(SeedsService);
  await seedsService.seed();
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});