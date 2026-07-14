import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

// Import entities
import { InstallationType } from '../modules/installation-types/entities/installation-type.entity';
import { EnvironmentType } from '../modules/environment-types/entities/environment-type.entity';
import { ArtifactType } from '../modules/artifact-types/entities/artifact-type.entity';
import { NormConst } from '../modules/calculations/entities/norm-const.entity';
import { DemandFactor } from '../modules/calculations/entities/demand-factor.entity';
import { Ampacity } from '../modules/calculations/entities/ampacity.entity';
import { BreakerCurve } from '../modules/calculations/entities/breaker-curve.entity';
import { Resistivity } from '../modules/calculations/entities/resistivity.entity';
import { GroundingRules } from '../modules/calculations/entities/grounding-rules.entity';
import { SeedsService } from './seeds/templates/seeds.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'electridom',
      password: process.env.DATABASE_PASSWORD || 'electridom',
      database: process.env.DATABASE_NAME || 'electridom',
      entities: [
        InstallationType,
        EnvironmentType,
        ArtifactType,
        NormConst,
        DemandFactor,
        Ampacity,
        BreakerCurve,
        Resistivity,
        GroundingRules,
      ],
      synchronize: false,
      logging: false,
    }),
    TypeOrmModule.forFeature([
      InstallationType,
      EnvironmentType,
      ArtifactType,
      NormConst,
      DemandFactor,
      Ampacity,
      BreakerCurve,
      Resistivity,
      GroundingRules,
    ]),
  ],
  providers: [SeedsService],
})
class SeedModule {}

async function bootstrap() {
  console.log('🌱 Starting seed process...\n');

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });

  try {
    const seedsService = app.get(SeedsService);
    await seedsService.seed();
    console.log('\n✅ All seeds loaded successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
