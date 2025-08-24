import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposArtefactosService } from './tipos-artefactos.service';
import { TiposArtefactosController } from './tipos-artefactos.controller';
import { TipoArtefacto } from './entities/tipo-artefacto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoArtefacto])],
  controllers: [TiposArtefactosController],
  providers: [TiposArtefactosService],
  exports: [TiposArtefactosService],
})
export class TiposArtefactosModule {}
