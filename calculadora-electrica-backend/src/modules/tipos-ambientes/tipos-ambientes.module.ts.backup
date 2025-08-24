import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposAmbientesService } from './tipos-environments.service';
import { TiposAmbientesController } from './tipos-environments.controller';
import { TipoAmbiente } from './entities/type-environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoAmbiente])],
  controllers: [TiposAmbientesController],
  providers: [TiposAmbientesService],
  exports: [TiposAmbientesService],
})
export class TiposAmbientesModule {}

