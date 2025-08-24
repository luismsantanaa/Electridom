import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposAmbientesService } from './tipos-ambientes.service';
import { TiposAmbientesController } from './tipos-ambientes.controller';
import { TipoAmbiente } from './entities/tipo-ambiente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoAmbiente])],
  controllers: [TiposAmbientesController],
  providers: [TiposAmbientesService],
  exports: [TiposAmbientesService],
})
export class TiposAmbientesModule {}
