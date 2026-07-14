import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  Proyecto, 
  Ambiente, 
  Carga, 
  Circuito, 
  Proteccion, 
  Conductor,
  NormativaAmpacidad,
  NormativaBreaker
} from './entities';
import { ModeladoElectricoController } from './controllers/modelado-electrico.controller';
import { ModeladoElectricoService } from './services/modelado-electrico.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Ambiente,
      Carga,
      Circuito,
      Proteccion,
      Conductor,
      NormativaAmpacidad,
      NormativaBreaker
    ])
  ],
  controllers: [ModeladoElectricoController],
  providers: [ModeladoElectricoService],
  exports: [ModeladoElectricoService]
})
export class ModeladoModule {}
