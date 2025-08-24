import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculosController } from './calculos.controller';
import { CalcRoomsController } from './controllers/calc-rooms.controller';
import { CalcDemandController } from './controllers/calc-demand.controller';
import { CalcCircuitsController } from './controllers/calc-circuits.controller';
import { CalcFeederController } from './controllers/calc-feeder.controller';
import { CalcGroundingController } from './controllers/calc-grounding.controller';
import { CalcReportController } from './controllers/calc-report.controller';
import { CalculationAppService } from './services/calculation-app.service';
import { CalculationDomainService } from './services/calculation-domain.service';
import { CalcEngineService } from './services/calc-engine.service';
import { NormParamService } from './services/norm-param.service';
import { DemandService } from './services/demand.service';
import { CircuitService } from './services/circuit.service';
import { VoltageDropService } from './services/voltage-drop.service';
import { GroundingService } from './services/grounding.service';
import { ReportService } from './services/report.service';
import { NormConst } from './entities/norm-const.entity';
import { DemandFactor } from './entities/demand-factor.entity';
import { Ampacity } from './entities/ampacity.entity';
import { BreakerCurve } from './entities/breaker-curve.entity';
import { Resistivity } from './entities/resistivity.entity';
import { GroundingRules } from './entities/grounding-rules.entity';
import { RulesModule } from '../rules/rules.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    RulesModule,
    MetricsModule,
    TypeOrmModule.forFeature([
      NormConst,
      DemandFactor,
      Ampacity,
      BreakerCurve,
      Resistivity,
      GroundingRules,
    ]),
  ],
  controllers: [
    CalculosController,
    CalcRoomsController,
    CalcDemandController,
    CalcCircuitsController,
    CalcFeederController,
    CalcGroundingController,
    CalcReportController,
  ],
  providers: [
    CalculationAppService,
    CalculationDomainService,
    CalcEngineService,
    NormParamService,
    DemandService,
    CircuitService,
    VoltageDropService,
    GroundingService,
    ReportService,
  ],
  exports: [
    CalculationAppService,
    CalcEngineService,
    NormParamService,
    DemandService,
    CircuitService,
    VoltageDropService,
    GroundingService,
    ReportService,
  ],
})
export class CalculosModule {}
