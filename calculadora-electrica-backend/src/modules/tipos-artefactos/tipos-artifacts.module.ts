import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposArtefactosService } from './tipos-artifacts.service';
import { TiposArtefactosController } from './tipos-artifacts.controller';
import { TipoArtefacto } from './entities/type-artifact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoArtefacto])],
  controllers: [TiposArtefactosController],
  providers: [TiposArtefactosService],
  exports: [TiposArtefactosService],
})
export class TiposArtefactosModule {}

