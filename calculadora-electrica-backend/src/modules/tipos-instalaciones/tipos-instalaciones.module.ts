import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposInstalacionesService } from './tipos-instalaciones.service';
import { TiposInstalacionesController } from './tipos-instalaciones.controller';
import { TipoInstalacion } from './entities/tipo-instalacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoInstalacion])],
  controllers: [TiposInstalacionesController],
  providers: [TiposInstalacionesService],
  exports: [TiposInstalacionesService],
})
export class TiposInstalacionesModule {}
