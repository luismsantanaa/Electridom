import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedsService } from './seeds.service';
import { InstallationType } from '../../modules/installation-types/entities/installation-type.entity';
import { EnvironmentType } from '../../modules/environment-types/entities/environment-type.entity';
import { ArtifactType } from '../../modules/artifact-types/entities/artifact-type.entity';
import { NormConst } from '../../modules/calculations/entities/norm-const.entity';
import { DemandFactor } from '../../modules/calculations/entities/demand-factor.entity';
import { Ampacity } from '../../modules/calculations/entities/ampacity.entity';
import { BreakerCurve } from '../../modules/calculations/entities/breaker-curve.entity';
import { Resistivity } from '../../modules/calculations/entities/resistivity.entity';
import { GroundingRules } from '../../modules/calculations/entities/grounding-rules.entity';
import { AppDataSource } from '../data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
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
  exports: [SeedsService],
})
export class SeedsModule {}

