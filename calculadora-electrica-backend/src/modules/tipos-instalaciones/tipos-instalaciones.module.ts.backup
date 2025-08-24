import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposInstalacionesService } from './tipos-installations.service';
import { TiposInstalacionesController } from './tipos-installations.controller';
import { TipoInstalacion } from './entities/type-installation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoInstalacion])],
  controllers: [TiposInstalacionesController],
  providers: [TiposInstalacionesService],
  exports: [TiposInstalacionesService],
})
export class TiposInstalacionesModule {}

