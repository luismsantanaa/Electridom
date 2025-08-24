import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedsService } from './seeds.service';
import { TipoInstalacion } from '../../modules/tipos-instalaciones/entities/tipo-instalacion.entity';
import { TipoAmbiente } from '../../modules/tipos-ambientes/entities/tipo-ambiente.entity';
import { TipoArtefacto } from '../../modules/tipos-artefactos/entities/tipo-artefacto.entity';
import { NormConst } from '../../modules/calculos/entities/norm-const.entity';
import { DemandFactor } from '../../modules/calculos/entities/demand-factor.entity';
import { Ampacity } from '../../modules/calculos/entities/ampacity.entity';
import { BreakerCurve } from '../../modules/calculos/entities/breaker-curve.entity';
import { Resistivity } from '../../modules/calculos/entities/resistivity.entity';
import { GroundingRules } from '../../modules/calculos/entities/grounding-rules.entity';
import { AppDataSource } from '../data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    TypeOrmModule.forFeature([
      TipoInstalacion,
      TipoAmbiente,
      TipoArtefacto,
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
